/**
 * Airwallex Payment Provider
 * For Morocco, Europe, and International payments
 * 
 * API Documentation: https://www.airwallex.com/docs/api
 */

import crypto from 'crypto';
import {
    IPaymentProvider,
    PaymentGateway,
    Currency,
    OrderPayload,
    PaymentSession,
    CallbackResult,
    PaymentStatus,
} from '../types';

// Configuration
const AIRWALLEX_CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID || '';
const AIRWALLEX_API_KEY = process.env.AIRWALLEX_API_KEY || '';
const AIRWALLEX_WEBHOOK_SECRET = process.env.AIRWALLEX_WEBHOOK_SECRET || '';
const AIRWALLEX_ENV = (process.env.AIRWALLEX_ENV || 'demo') as 'demo' | 'prod';

// API URLs
const AIRWALLEX_API_URL = AIRWALLEX_ENV === 'prod'
    ? 'https://api.airwallex.com/api/v1'
    : 'https://api-demo.airwallex.com/api/v1';

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get authentication token from Airwallex
 */
async function getAuthToken(): Promise<string> {
    // Check if we have a valid cached token
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
        return cachedToken.token;
    }

    try {
        const response = await fetch(`${AIRWALLEX_API_URL}/authentication/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': AIRWALLEX_CLIENT_ID,
                'x-api-key': AIRWALLEX_API_KEY,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Airwallex] Auth failed:', errorData);
            throw new Error(`Authentication failed: ${response.status}`);
        }

        const data = await response.json();

        // Cache the token (expires in 30 minutes, we'll refresh at 25 min)
        cachedToken = {
            token: data.token,
            expiresAt: Date.now() + 25 * 60 * 1000, // 25 minutes
        };

        console.log('[Airwallex] Authentication successful');
        return data.token;
    } catch (error) {
        console.error('[Airwallex] Auth error:', error);
        throw error;
    }
}

/**
 * Verify Airwallex webhook signature
 * Based on Airwallex documentation:
 * - x-timestamp: Unix timestamp in milliseconds
 * - x-signature: HMAC-SHA256(timestamp + payload, webhook_secret)
 */
function verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    if (!AIRWALLEX_WEBHOOK_SECRET) {
        console.warn('[Airwallex] Webhook secret not configured');
        return false;
    }

    try {
        // Airwallex uses HMAC-SHA256 for webhook verification
        // value_to_digest = x-timestamp (string) + raw JSON payload (string)
        const message = `${timestamp}${payload}`;
        const expectedSignature = crypto
            .createHmac('sha256', AIRWALLEX_WEBHOOK_SECRET)
            .update(message)
            .digest('hex');

        const isValid = signature === expectedSignature;

        if (!isValid) {
            console.log('[Airwallex] Signature mismatch:', {
                received: signature.substring(0, 20) + '...',
                expected: expectedSignature.substring(0, 20) + '...',
            });
        }

        return isValid;
    } catch (error) {
        console.error('[Airwallex] Webhook verification error:', error);
        return false;
    }
}

/**
 * Airwallex webhook payload type
 */
export interface AirwallexWebhookPayload {
    id: string;
    name: string; // 'payment_intent.succeeded', 'payment_intent.requires_payment_method', etc.
    account_id: string;
    data: {
        object: {
            id: string;
            request_id: string;
            amount: number;
            currency: string;
            merchant_order_id: string;
            status: 'SUCCEEDED' | 'REQUIRES_PAYMENT_METHOD' | 'REQUIRES_CAPTURE' | 'CANCELLED';
            captured_amount?: number;
            payment_method?: {
                type: string;
            };
            metadata?: Record<string, string>;
        };
    };
    created_at: string;
}

/**
 * Airwallex Payment Provider Implementation
 */
export class AirwallexProvider implements IPaymentProvider {
    readonly gateway: PaymentGateway = 'airwallex';
    readonly supportedCurrencies: Currency[] = ['USD', 'EUR', 'MAD'];

    /**
     * Check if Airwallex is configured
     */
    isConfigured(): boolean {
        return !!(AIRWALLEX_CLIENT_ID && AIRWALLEX_API_KEY);
    }

    /**
     * Create an Airwallex payment session (PaymentIntent + Hosted Page URL)
     */
    async createSession(order: OrderPayload, _method?: string): Promise<PaymentSession> {
        try {
            if (!this.isConfigured()) {
                console.warn('[Airwallex] API keys not configured');
                return {
                    success: false,
                    gateway: this.gateway,
                    error: 'Airwallex n\'est pas configuré. Veuillez utiliser le paiement à la livraison.',
                    errorCode: 'NOT_CONFIGURED',
                };
            }

            // Get auth token
            const token = await getAuthToken();

            // Use production URL for callbacks
            const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                process.env.NEXT_PUBLIC_SITE_URL ||
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                'https://nubiaaura.com';

            const locale = order.locale || 'fr';

            // Create PaymentIntent
            const paymentIntentPayload = {
                request_id: `req_${order.orderId}_${Date.now()}`,
                amount: order.amount,
                currency: order.currency,
                merchant_order_id: order.orderId,
                order: {
                    type: 'physical_goods',
                },
                metadata: {
                    order_number: order.orderNumber,
                    customer_email: order.customer.email,
                    customer_phone: order.customer.phone,
                    customer_name: `${order.customer.firstName} ${order.customer.lastName}`,
                },
                return_url: `${appBaseUrl}/${locale}/payments/callback?orderId=${order.orderId}&status=success&gateway=airwallex`,
                // Descriptor shown on customer's statement
                descriptor: 'NUBIA AURA',
            };

            console.log('[Airwallex] Creating PaymentIntent:', {
                amount: order.amount,
                currency: order.currency,
                orderId: order.orderId,
            });

            const response = await fetch(`${AIRWALLEX_API_URL}/pa/payment_intents/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(paymentIntentPayload),
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('[Airwallex] PaymentIntent creation failed:', responseData);
                return {
                    success: false,
                    gateway: this.gateway,
                    error: responseData.message || 'Erreur lors de la création du paiement',
                    errorCode: responseData.code || 'API_ERROR',
                };
            }

            console.log('[Airwallex] PaymentIntent created:', {
                id: responseData.id,
                status: responseData.status,
            });

            // Build Hosted Payment Page URL
            const hppParams = new URLSearchParams({
                client_secret: responseData.client_secret,
                env: AIRWALLEX_ENV,
                currency: order.currency,
                // Optional: pre-fill customer info
                shopper_email: order.customer.email,
                shopper_phone: order.customer.phone,
                shopper_name: `${order.customer.firstName} ${order.customer.lastName}`,
            });

            // Airwallex Hosted Payment Page URL
            const hppBaseUrl = AIRWALLEX_ENV === 'prod'
                ? 'https://checkout.airwallex.com'
                : 'https://checkout-demo.airwallex.com';

            const redirectUrl = `${hppBaseUrl}/?${hppParams.toString()}`;

            return {
                success: true,
                gateway: this.gateway,
                transactionId: responseData.id,
                redirectUrl,
            };

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[Airwallex] Create session error:', errorMessage);
            return {
                success: false,
                gateway: this.gateway,
                error: `Erreur Airwallex: ${errorMessage}`,
                errorCode: 'CONNECTION_ERROR',
            };
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhook(payload: unknown, signature?: string): boolean {
        if (!signature) return false;

        // Extract timestamp and signature from header
        // Format: t=timestamp,v1=signature
        const parts = signature.split(',');
        const timestamp = parts.find(p => p.startsWith('t='))?.slice(2);
        const sig = parts.find(p => p.startsWith('v1='))?.slice(3);

        if (!timestamp || !sig) return false;

        const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
        return verifyWebhookSignature(payloadString, sig, timestamp);
    }

    /**
     * Handle webhook callback
     */
    async handleCallback(payload: unknown): Promise<CallbackResult> {
        const data = payload as AirwallexWebhookPayload;

        const eventName = data.name;
        const paymentIntent = data.data?.object;

        if (!paymentIntent) {
            return {
                success: false,
                orderId: '',
                status: 'failed',
                processedAt: new Date().toISOString(),
                error: 'Invalid webhook payload',
            };
        }

        // Map Airwallex status to our status
        let status: PaymentStatus = 'pending';
        let success = false;

        switch (eventName) {
            case 'payment_intent.succeeded':
                status = 'paid';
                success = true;
                break;
            case 'payment_intent.cancelled':
                status = 'cancelled';
                break;
            case 'payment_intent.requires_payment_method':
                status = 'failed';
                break;
            default:
                status = 'processing';
        }

        return {
            success,
            orderId: paymentIntent.merchant_order_id,
            transactionId: paymentIntent.id,
            status,
            paymentMethod: paymentIntent.payment_method?.type,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency as Currency,
            processedAt: new Date().toISOString(),
            rawPayload: data,
        };
    }

    /**
     * Get payment status from Airwallex
     */
    async getStatus(transactionId: string): Promise<PaymentStatus> {
        try {
            const token = await getAuthToken();

            const response = await fetch(`${AIRWALLEX_API_URL}/pa/payment_intents/${transactionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                console.error('[Airwallex] Get status failed:', response.status);
                return 'pending';
            }

            const data = await response.json();

            switch (data.status) {
                case 'SUCCEEDED':
                    return 'paid';
                case 'CANCELLED':
                    return 'cancelled';
                case 'REQUIRES_PAYMENT_METHOD':
                case 'REQUIRES_CUSTOMER_ACTION':
                    return 'pending';
                default:
                    return 'processing';
            }
        } catch (error) {
            console.error('[Airwallex] Get status error:', error);
            return 'pending';
        }
    }
}

// Export singleton instance
export const airwallexProvider = new AirwallexProvider();
