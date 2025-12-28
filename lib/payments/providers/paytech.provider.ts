/**
 * PayTech Payment Provider
 * For Senegal: Wave, Orange Money, Free Money
 * For International: Visa, Mastercard, Amex (USD/EUR)
 * 
 * API Documentation: https://docs.intech.sn/doc_paytech.php
 */

import crypto from 'crypto';
import axios from 'axios';
import {
    IPaymentProvider,
    PaymentGateway,
    Currency,
    OrderPayload,
    PaymentSession,
    CallbackResult,
    PaymentStatus,
    PaytechWebhookPayload,
} from '../types';

// Configuration
const PAYTECH_API_KEY = process.env.PAYTECH_API_KEY || '';
const PAYTECH_SECRET_KEY = process.env.PAYTECH_SECRET_KEY || '';
const PAYTECH_ENV = (process.env.PAYTECH_ENV || 'test') as 'test' | 'prod';
const PAYTECH_API_URL = 'https://paytech.sn/api/payment/request-payment';

// Target payment methods mapping
// Note: PayTech uses 'Carte Bancaire' for all card types (Visa, Mastercard, Amex)
const TARGET_PAYMENT_MAP: Record<string, string> = {
    wave: 'Wave',
    orange_money: 'Orange Money',
    free_money: 'Free Money',
    card: 'Carte Bancaire',
    visa: 'Carte Bancaire',
    mastercard: 'Carte Bancaire',
    amex: 'Carte Bancaire',
};

/**
 * Verify PayTech IPN using HMAC-SHA256 (recommended method)
 */
function verifyPaytechHMAC(payload: PaytechWebhookPayload): boolean {
    if (!PAYTECH_API_KEY || !PAYTECH_SECRET_KEY) return false;

    try {
        // HMAC method: HMAC-SHA256(api_secret, item_price|ref_command|api_key)
        if (payload.hmac_compute) {
            const message = `${payload.item_price}|${payload.ref_command}|${PAYTECH_API_KEY}`;
            const expectedHmac = crypto
                .createHmac('sha256', PAYTECH_SECRET_KEY)
                .update(message)
                .digest('hex');

            return payload.hmac_compute === expectedHmac;
        }

        // Fallback: SHA256 hash verification
        const expectedApiKeyHash = crypto
            .createHash('sha256')
            .update(PAYTECH_API_KEY)
            .digest('hex');
        const expectedSecretHash = crypto
            .createHash('sha256')
            .update(PAYTECH_SECRET_KEY)
            .digest('hex');

        return (
            payload.api_key_sha256 === expectedApiKeyHash &&
            payload.api_secret_sha256 === expectedSecretHash
        );
    } catch (error) {
        console.error('[PayTech] HMAC verification error:', error);
        return false;
    }
}

/**
 * PayTech Payment Provider Implementation
 */
export class PaytechProvider implements IPaymentProvider {
    readonly gateway: PaymentGateway = 'paytech';
    readonly supportedCurrencies: Currency[] = ['XOF', 'USD', 'EUR', 'MAD'];

    /**
     * Check if PayTech is configured
     */
    isConfigured(): boolean {
        return !!(PAYTECH_API_KEY && PAYTECH_SECRET_KEY);
    }

    /**
     * Create a PayTech payment session
     * @param order Order details
     * @param method Optional: 'wave', 'orange_money', 'free_money', 'card'
     */
    async createSession(order: OrderPayload, method?: string): Promise<PaymentSession> {
        try {
            if (!this.isConfigured()) {
                console.warn('[PayTech] API keys not configured');
                return {
                    success: false,
                    gateway: this.gateway,
                    error: 'PayTech n\'est pas configuré. Veuillez utiliser le paiement à la livraison.',
                    errorCode: 'NOT_CONFIGURED',
                };
            }

            const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

            // Determine target payment method
            let targetPayment: string | undefined;
            if (method && TARGET_PAYMENT_MAP[method]) {
                targetPayment = TARGET_PAYMENT_MAP[method];
            } else if (order.currency === 'USD' || order.currency === 'EUR') {
                // International payments use card
                targetPayment = 'Carte Bancaire';
            }

            // Build payment request
            const paymentRequest = {
                item_name: `Commande ${order.orderNumber}`,
                item_price: order.amount,
                currency: order.currency,
                ref_command: order.orderId,
                command_name: `Commande Nubia Aura - ${order.orderNumber}`,
                env: PAYTECH_ENV,
                ipn_url: `${appBaseUrl}/api/webhooks/paytech`,
                success_url: `${appBaseUrl}/payments/callback?orderId=${order.orderId}&status=success&gateway=paytech`,
                cancel_url: `${appBaseUrl}/payments/callback?orderId=${order.orderId}&status=cancelled&gateway=paytech`,
                custom_field: JSON.stringify({
                    customer_email: order.customer.email,
                    customer_phone: order.customer.phone,
                    customer_name: `${order.customer.firstName} ${order.customer.lastName}`,
                    order_number: order.orderNumber,
                }),
                ...(targetPayment && { target_payment: targetPayment }),
            };

            console.log('[PayTech] Initializing payment:', {
                ref: order.orderId,
                amount: order.amount,
                currency: order.currency,
                method: targetPayment || 'all',
            });

            // Call PayTech API
            const response = await axios.post(PAYTECH_API_URL, paymentRequest, {
                headers: {
                    'API_KEY': PAYTECH_API_KEY,
                    'API_SECRET': PAYTECH_SECRET_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 15000,
            });

            if (response.data.success === 1) {
                let redirectUrl = response.data.redirect_url;

                // Add autofill parameters if single payment method
                if (targetPayment && !targetPayment.includes(',')) {
                    const queryParams = new URLSearchParams({
                        pn: order.customer.phone,
                        fn: `${order.customer.firstName} ${order.customer.lastName}`,
                        tp: targetPayment,
                        nac: targetPayment === 'Carte Bancaire' ? '0' : '1', // Auto-submit for mobile money
                    });
                    redirectUrl += (redirectUrl.includes('?') ? '&' : '?') + queryParams.toString();
                }

                console.log('[PayTech] Payment session created:', {
                    token: response.data.token,
                    redirectUrl: redirectUrl.substring(0, 50) + '...',
                });

                return {
                    success: true,
                    gateway: this.gateway,
                    transactionId: response.data.token,
                    redirectUrl,
                };
            } else {
                console.error('[PayTech] API error:', response.data);
                return {
                    success: false,
                    gateway: this.gateway,
                    error: response.data.message || 'Erreur lors de l\'initialisation du paiement',
                    errorCode: 'API_ERROR',
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[PayTech] Create session error:', errorMessage);

            return {
                success: false,
                gateway: this.gateway,
                error: 'Erreur de connexion à PayTech. Veuillez réessayer.',
                errorCode: 'CONNECTION_ERROR',
            };
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhook(payload: unknown): boolean {
        return verifyPaytechHMAC(payload as PaytechWebhookPayload);
    }

    /**
     * Handle IPN callback
     */
    async handleCallback(payload: unknown): Promise<CallbackResult> {
        const data = payload as PaytechWebhookPayload;

        const isSuccess = data.type_event === 'sale_complete';
        // Note: custom_field is available in data.custom_field if needed

        return {
            success: isSuccess,
            orderId: data.ref_command,
            transactionId: data.token,
            status: isSuccess ? 'paid' : 'cancelled',
            paymentMethod: data.payment_method,
            amount: parseFloat(data.item_price),
            currency: 'XOF', // PayTech IPN doesn't always include currency
            processedAt: new Date().toISOString(),
            rawPayload: data,
        };
    }

    /**
     * Get payment status (PayTech doesn't provide a status API)
     */
    async getStatus(_transactionId: string): Promise<PaymentStatus> {
        // PayTech doesn't provide a status check API - status comes via IPN
        console.warn('[PayTech] getStatus not available, use webhooks instead');
        return 'pending';
    }
}

// Export singleton instance
export const paytechProvider = new PaytechProvider();
