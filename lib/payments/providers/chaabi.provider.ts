/**
 * Chaabi Payment Provider
 * For Morocco: Cards via M2T/Payzone (Banque Populaire)
 * 
 * Documentation: Internal M2T/Payzone integration
 * Security: HMAC-SHA256 signature, Secure Chaabi (3D Secure)
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
    ChaabiWebhookPayload,
} from '../types';

// Configuration
const CHAABI_API_KEY = process.env.CHAABI_API_KEY || '';
const CHAABI_SECRET_KEY = process.env.CHAABI_SECRET_KEY || '';
const CHAABI_GATEWAY_URL = process.env.CHAABI_GATEWAY_URL || 'https://payment.chaabi.ma/checkout';


/**
 * Generate simple hash for form data
 */
function generateFormHash(params: {
    apiKey: string;
    orderId: string;
    amount: string;
    currency: string;
    secretKey: string;
}): string {
    const { apiKey, orderId, amount, currency, secretKey } = params;
    const stringToHash = `${apiKey}|${orderId}|${amount}|${currency}`;

    return crypto
        .createHmac('sha256', secretKey)
        .update(stringToHash)
        .digest('hex');
}

/**
 * Verify Chaabi webhook signature
 */
function verifyChaabiSignature(payload: ChaabiWebhookPayload, secretKey: string): boolean {
    try {
        const { order_id, transaction_id, amount, currency, status, timestamp, hash } = payload;
        const stringToHash = `${order_id}|${transaction_id}|${amount}|${currency}|${status}|${timestamp}`;

        const expectedHash = crypto
            .createHmac('sha256', secretKey)
            .update(stringToHash)
            .digest('hex');

        return hash === expectedHash;
    } catch (error) {
        console.error('[Chaabi] Signature verification error:', error);
        return false;
    }
}

/**
 * Chaabi Payment Provider Implementation
 */
export class ChaabiProvider implements IPaymentProvider {
    readonly gateway: PaymentGateway = 'chaabi';
    readonly supportedCurrencies: Currency[] = ['MAD'];

    /**
     * Check if Chaabi is configured
     */
    isConfigured(): boolean {
        return !!(CHAABI_API_KEY && CHAABI_SECRET_KEY);
    }

    /**
     * Create a Chaabi payment session
     * Returns form data to submit to the gateway
     */
    async createSession(order: OrderPayload): Promise<PaymentSession> {
        try {
            if (!this.isConfigured()) {
                console.warn('[Chaabi] API credentials not configured');
                return {
                    success: false,
                    gateway: this.gateway,
                    error: 'Chaabi Payment n\'est pas configuré. Veuillez utiliser le paiement à la livraison.',
                    errorCode: 'NOT_CONFIGURED',
                };
            }

            // Validate currency
            if (order.currency !== 'MAD') {
                return {
                    success: false,
                    gateway: this.gateway,
                    error: 'Chaabi Payment ne supporte que le Dirham marocain (MAD)',
                    errorCode: 'INVALID_CURRENCY',
                };
            }

            const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const transactionId = `CHB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Amount in centimes (1 MAD = 100 centimes)
            const amountInCentimes = Math.round(order.amount * 100).toString();

            // Generate form hash
            const hash = generateFormHash({
                apiKey: CHAABI_API_KEY,
                orderId: order.orderId,
                amount: amountInCentimes,
                currency: '504', // MAD ISO code
                secretKey: CHAABI_SECRET_KEY,
            });

            // Build form data for gateway submission
            const formData: Record<string, string> = {
                api_key: CHAABI_API_KEY,
                order_id: order.orderId,
                transaction_id: transactionId,
                amount: amountInCentimes,
                currency: '504', // MAD
                hash: hash,
                customer_email: order.customer.email,
                customer_name: `${order.customer.firstName} ${order.customer.lastName}`,
                customer_phone: order.customer.phone,
                description: `Commande Nubia Aura - ${order.orderNumber}`,
                success_url: `${appBaseUrl}/payments/callback?orderId=${order.orderId}&status=success&gateway=chaabi`,
                fail_url: `${appBaseUrl}/payments/callback?orderId=${order.orderId}&status=failed&gateway=chaabi`,
                callback_url: `${appBaseUrl}/api/webhooks/chaabi`,
                lang: order.locale === 'fr' ? 'fr' : 'en',
                store_type: '3D_PAY_HOSTING',
                tran_type: 'Sale',
            };

            console.log('[Chaabi] Payment session created:', {
                orderId: order.orderId,
                transactionId,
                amount: order.amount,
                currency: order.currency,
            });

            return {
                success: true,
                gateway: this.gateway,
                transactionId,
                formData,
                gatewayUrl: CHAABI_GATEWAY_URL,
            };
        } catch (error) {
            console.error('[Chaabi] Create session error:', error);
            return {
                success: false,
                gateway: this.gateway,
                error: 'Erreur lors de l\'initialisation du paiement Chaabi',
                errorCode: 'INIT_ERROR',
            };
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhook(payload: unknown): boolean {
        if (!CHAABI_SECRET_KEY) {
            console.error('[Chaabi] Secret key not configured for webhook verification');
            return false;
        }

        return verifyChaabiSignature(payload as ChaabiWebhookPayload, CHAABI_SECRET_KEY);
    }

    /**
     * Handle webhook callback
     */
    async handleCallback(payload: unknown): Promise<CallbackResult> {
        const data = payload as ChaabiWebhookPayload;

        const isSuccess = data.status === 'approved';

        return {
            success: isSuccess,
            orderId: data.order_id,
            transactionId: data.transaction_id,
            status: isSuccess ? 'paid' : 'failed',
            paymentMethod: 'chaabi_card',
            amount: parseFloat(data.amount) / 100, // Convert from centimes
            currency: 'MAD',
            processedAt: new Date().toISOString(),
            rawPayload: data,
        };
    }

    /**
     * Get payment status (if supported by Chaabi API)
     */
    async getStatus(_transactionId: string): Promise<PaymentStatus> {
        // Note: Implement if Chaabi provides a status check API
        console.warn('[Chaabi] getStatus not implemented, returning pending');
        return 'pending';
    }
}

// Export singleton instance
export const chaabiProvider = new ChaabiProvider();
