/**
 * PayDunya Payment Provider
 * Mobile Money & Card payments for West Africa
 * 
 * Supported methods:
 * - Wave (Senegal, Côte d'Ivoire)
 * - Orange Money (Senegal, Côte d'Ivoire, Mali, Benin)
 * - MTN Money (Côte d'Ivoire, Benin)
 * - Moov Money (Côte d'Ivoire, Mali, Benin, Togo, Niger)
 * - Free Money (Senegal)
 * - Wizall (Senegal)
 * - E-Money (Senegal - Expresso)
 * - Cards (Visa, Mastercard)
 * 
 * API Documentation: https://paydunya.com/developers
 * 
 * IMPORTANT: Uses direct API calls instead of SDK to avoid serverless compatibility issues
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

// Configuration from environment variables
const PAYDUNYA_MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY || '';
const PAYDUNYA_PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY || '';
const PAYDUNYA_TOKEN = process.env.PAYDUNYA_TOKEN || '';
const PAYDUNYA_MODE = (process.env.PAYDUNYA_MODE || 'test') as 'test' | 'live';

// API Base URLs
const API_BASE_URL = PAYDUNYA_MODE === 'live'
    ? 'https://app.paydunya.com/api/v1'
    : 'https://app.paydunya.com/sandbox-api/v1';

// Channel mapping for payment method restrictions
// Reference: https://paydunya.com/developers/channels
const CHANNEL_MAP: Record<string, string> = {
    // Senegal
    wave: 'wave-senegal',
    orange_money: 'orange-money-senegal',
    free_money: 'free-money-senegal',
    wizall: 'wizall-senegal',
    expresso: 'emoney-senegal',
    // Côte d'Ivoire
    mtn_money: 'mtn-ci',
    moov_money: 'moov-ci',
    orange_money_ci: 'orange-money-ci',
    wave_ci: 'wave-ci',
    // Mali
    orange_money_ml: 'orange-money-mali',
    moov_money_ml: 'moov-mali',
    // Benin
    mtn_money_bj: 'mtn-benin',
    moov_money_bj: 'moov-benin',
    // Togo
    flooz: 'flooz-togo',
    tmoney: 't-money-togo',
    moov_money_tg: 'moov-togo',
    // Burkina Faso
    orange_money_bf: 'orange-money-burkina',
    moov_money_bf: 'moov-burkina',
    // Cards
    card: 'card',
};

// PayDunya webhook payload interface
export interface PaydunyaWebhookPayload {
    data: {
        hash: string;
        status: 'pending' | 'completed' | 'cancelled';
        response_code: string;
        response_text: string;
        invoice: {
            token: string;
            total_amount: string | number;
            description: string;
            items?: Record<string, {
                name: string;
                quantity: string;
                unit_price: string;
                total_price: string;
                description?: string;
            }>;
            taxes?: Record<string, {
                name: string;
                amount: string;
            }>;
        };
        customer?: {
            name: string;
            phone: string;
            email: string;
        };
        custom_data?: Record<string, string>;
        actions?: {
            cancel_url?: string;
            callback_url?: string;
            return_url?: string;
        };
        mode: 'test' | 'live';
        receipt_url?: string;
        fail_reason?: string;
    };
}

// PayDunya API response interfaces
interface PaydunyaInvoiceResponse {
    response_code: string;
    response_text: string;
    description?: string;
    token?: string;
    invoice_url?: string;
    status?: string;
}

interface PaydunyaConfirmResponse {
    response_code: string;
    response_text: string;
    invoice?: {
        status: 'pending' | 'completed' | 'cancelled';
        token: string;
        total_amount: number;
    };
    customer?: {
        name: string;
        phone: string;
        email: string;
    };
    custom_data?: Record<string, string>;
    receipt_url?: string;
}

/**
 * Verify PayDunya IPN using SHA-512 hash of Master Key
 */
function verifyPaydunyaHash(receivedHash: string): boolean {
    if (!PAYDUNYA_MASTER_KEY) return false;

    try {
        const expectedHash = crypto
            .createHash('sha512')
            .update(PAYDUNYA_MASTER_KEY)
            .digest('hex');

        return receivedHash === expectedHash;
    } catch (error) {
        console.error('[PayDunya] Hash verification error:', error);
        return false;
    }
}

/**
 * PayDunya Payment Provider Implementation
 * Uses direct API calls instead of SDK for serverless compatibility
 */
export class PaydunyaProvider implements IPaymentProvider {
    readonly gateway: PaymentGateway = 'paydunya';
    readonly supportedCurrencies: Currency[] = ['XOF'];

    /**
     * Check if PayDunya is configured
     */
    isConfigured(): boolean {
        return !!(PAYDUNYA_MASTER_KEY && PAYDUNYA_PRIVATE_KEY && PAYDUNYA_TOKEN);
    }

    /**
     * Get common headers for PayDunya API requests
     */
    private getHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY,
            'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY,
            'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN,
        };
    }

    /**
     * Create a PayDunya payment session
     * @param order Order details
     * @param method Optional: 'wave', 'orange_money', 'card', etc.
     */
    async createSession(order: OrderPayload, method?: string): Promise<PaymentSession> {
        try {
            if (!this.isConfigured()) {
                console.warn('[PayDunya] API keys not configured');
                return {
                    success: false,
                    gateway: this.gateway,
                    error: 'PayDunya n\'est pas configuré. Veuillez utiliser le paiement à la livraison.',
                    errorCode: 'NOT_CONFIGURED',
                };
            }

            // Get base URL for callbacks
            const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                process.env.NEXT_PUBLIC_SITE_URL ||
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                'https://nubiaaura.com';

            const locale = order.locale || 'fr';

            // Build items object for PayDunya
            const items: Record<string, { name: string; quantity: number; unit_price: number; total_price: number; description: string }> = {};
            order.items.forEach((item, index) => {
                items[`item_${index}`] = {
                    name: item.name || 'Article',
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity,
                    description: '',
                };
            });

            // Build channels array if specific method requested
            const channels: string[] = [];
            if (method && CHANNEL_MAP[method]) {
                channels.push(CHANNEL_MAP[method]);
            }

            // Build request payload
            const payload = {
                invoice: {
                    items,
                    total_amount: order.amount,
                    description: `Commande ${order.orderNumber} - NUBIA AURA`,
                },
                store: {
                    name: 'NUBIA AURA',
                    tagline: 'Mode africaine authentique',
                    phone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+221781234567',
                    postal_address: 'Dakar, Sénégal',
                    website_url: appBaseUrl,
                    logo_url: `${appBaseUrl}/images/logo.png`,
                },
                actions: {
                    return_url: `${appBaseUrl}/${locale}/payments/callback?orderId=${order.orderId}&status=success&gateway=paydunya`,
                    cancel_url: `${appBaseUrl}/${locale}/payments/callback?orderId=${order.orderId}&status=cancelled&gateway=paydunya`,
                    callback_url: `${appBaseUrl}/api/webhooks/paydunya`,
                },
                custom_data: {
                    order_id: order.orderId,
                    order_number: order.orderNumber,
                    customer_email: order.customer.email,
                    customer_phone: order.customer.phone,
                    customer_name: `${order.customer.firstName} ${order.customer.lastName}`,
                },
                ...(channels.length > 0 && { channels }),
            };

            console.log('[PayDunya] Initializing payment:', {
                orderId: order.orderId,
                orderNumber: order.orderNumber,
                amount: order.amount,
                currency: order.currency,
                method: method || 'all',
                mode: PAYDUNYA_MODE,
            });

            // Make API request
            const response = await fetch(`${API_BASE_URL}/checkout-invoice/create`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload),
            });

            const result: PaydunyaInvoiceResponse = await response.json();

            // PayDunya returns the invoice URL in response_text when successful
            // The token can be in a separate field or extracted from the URL
            const invoiceUrl = result.invoice_url ||
                (result.response_code === '00' && result.response_text?.startsWith('http') ? result.response_text : null);

            // Extract token from URL if not provided separately
            // URL format: https://paydunya.com/sandbox-checkout/invoice/test_eHQuBXLZde
            const extractedToken = result.token || (invoiceUrl ? invoiceUrl.split('/').pop() : null);

            if (result.response_code === '00' && invoiceUrl) {
                console.log('[PayDunya] Payment session created:', {
                    token: extractedToken,
                    url: invoiceUrl?.substring(0, 60) + '...',
                });

                return {
                    success: true,
                    gateway: this.gateway,
                    transactionId: extractedToken || '',
                    redirectUrl: invoiceUrl,
                };
            } else {
                console.error('[PayDunya] Invoice creation failed:', {
                    responseCode: result.response_code,
                    responseText: result.response_text,
                });

                return {
                    success: false,
                    gateway: this.gateway,
                    error: result.response_text || 'Erreur lors de la création de la facture PayDunya',
                    errorCode: 'INVOICE_CREATION_FAILED',
                };
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[PayDunya] Create session error:', errorMessage);

            return {
                success: false,
                gateway: this.gateway,
                error: `Erreur PayDunya: ${errorMessage}`,
                errorCode: 'CONNECTION_ERROR',
            };
        }
    }

    /**
     * Verify webhook signature using SHA-512 hash of Master Key
     */
    verifyWebhook(payload: unknown): boolean {
        const data = payload as PaydunyaWebhookPayload;
        if (!data?.data?.hash) {
            console.error('[PayDunya] Missing hash in webhook payload');
            return false;
        }
        return verifyPaydunyaHash(data.data.hash);
    }

    /**
     * Handle IPN callback from PayDunya
     */
    async handleCallback(payload: unknown): Promise<CallbackResult> {
        const data = (payload as PaydunyaWebhookPayload).data;

        const isSuccess = data.status === 'completed';
        const orderId = data.custom_data?.order_id || '';
        const amount = typeof data.invoice.total_amount === 'string'
            ? parseFloat(data.invoice.total_amount)
            : data.invoice.total_amount;

        return {
            success: isSuccess,
            orderId: orderId,
            transactionId: data.invoice.token,
            status: isSuccess ? 'paid' : (data.status === 'cancelled' ? 'cancelled' : 'pending'),
            paymentMethod: 'paydunya',
            amount: amount,
            currency: 'XOF',
            processedAt: new Date().toISOString(),
            rawPayload: data,
            error: data.fail_reason,
        };
    }

    /**
     * Get payment status by confirming invoice token
     */
    async getStatus(token: string): Promise<PaymentStatus> {
        try {
            if (!this.isConfigured()) {
                console.warn('[PayDunya] Not configured for status check');
                return 'pending';
            }

            const response = await fetch(`${API_BASE_URL}/checkout-invoice/confirm/${token}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            const result: PaydunyaConfirmResponse = await response.json();

            if (result.response_code === '00' && result.invoice) {
                switch (result.invoice.status) {
                    case 'completed':
                        return 'paid';
                    case 'cancelled':
                        return 'cancelled';
                    case 'pending':
                    default:
                        return 'pending';
                }
            }

            return 'pending';
        } catch (error) {
            console.error('[PayDunya] Get status error:', error);
            return 'pending';
        }
    }

    /**
     * Confirm payment status (useful for return URL verification)
     */
    async confirmPayment(token: string): Promise<{
        success: boolean;
        status: PaymentStatus;
        customer?: { name: string; phone: string; email: string };
        receiptUrl?: string;
        orderId?: string;
    }> {
        try {
            if (!this.isConfigured()) {
                return { success: false, status: 'pending' };
            }

            const response = await fetch(`${API_BASE_URL}/checkout-invoice/confirm/${token}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            const result: PaydunyaConfirmResponse = await response.json();

            if (result.response_code === '00' && result.invoice) {
                const status: PaymentStatus = result.invoice.status === 'completed' ? 'paid' :
                    result.invoice.status === 'cancelled' ? 'cancelled' : 'pending';

                return {
                    success: result.invoice.status === 'completed',
                    status,
                    customer: result.customer,
                    receiptUrl: result.receipt_url,
                    orderId: result.custom_data?.order_id,
                };
            }

            return { success: false, status: 'pending' };
        } catch (error) {
            console.error('[PayDunya] Confirm payment error:', error);
            return { success: false, status: 'pending' };
        }
    }
}

// Export singleton instance
export const paydunyaProvider = new PaydunyaProvider();
