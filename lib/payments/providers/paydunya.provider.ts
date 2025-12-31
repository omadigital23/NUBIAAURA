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

// PayDunya SDK
// eslint-disable-next-line @typescript-eslint/no-require-imports
const paydunya = require('paydunya');

// Configuration from environment variables
const PAYDUNYA_MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY || '';
const PAYDUNYA_PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY || '';
const PAYDUNYA_PUBLIC_KEY = process.env.PAYDUNYA_PUBLIC_KEY || '';
const PAYDUNYA_TOKEN = process.env.PAYDUNYA_TOKEN || '';
const PAYDUNYA_MODE = (process.env.PAYDUNYA_MODE || 'test') as 'test' | 'live';

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
 */
export class PaydunyaProvider implements IPaymentProvider {
    readonly gateway: PaymentGateway = 'paydunya';
    readonly supportedCurrencies: Currency[] = ['XOF'];

    private setup: typeof paydunya.Setup | null = null;
    private store: typeof paydunya.Store | null = null;

    /**
     * Check if PayDunya is configured
     */
    isConfigured(): boolean {
        return !!(PAYDUNYA_MASTER_KEY && PAYDUNYA_PRIVATE_KEY && PAYDUNYA_TOKEN);
    }

    /**
     * Initialize PayDunya SDK
     */
    private initializeSDK(): void {
        if (this.setup && this.store) return;

        if (!this.isConfigured()) {
            throw new Error('PayDunya is not configured');
        }

        // Setup API keys
        this.setup = new paydunya.Setup({
            masterKey: PAYDUNYA_MASTER_KEY,
            privateKey: PAYDUNYA_PRIVATE_KEY,
            publicKey: PAYDUNYA_PUBLIC_KEY,
            token: PAYDUNYA_TOKEN,
            mode: PAYDUNYA_MODE,
        });

        // Get base URL for callbacks
        const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
            'https://nubiaaura.com';

        // Store configuration
        this.store = new paydunya.Store({
            name: 'NUBIA AURA',
            tagline: 'Mode africaine authentique',
            phoneNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+221781234567',
            postalAddress: 'Dakar, Sénégal',
            websiteURL: appBaseUrl,
            logoURL: `${appBaseUrl}/images/logo.png`,
            callbackURL: `${appBaseUrl}/api/webhooks/paydunya`,
        });
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

            this.initializeSDK();

            // Get base URL for callbacks
            const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                process.env.NEXT_PUBLIC_SITE_URL ||
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                'https://nubiaaura.com';

            const locale = order.locale || 'fr';

            // Create invoice
            const invoice = new paydunya.CheckoutInvoice(this.setup, this.store);

            // Add items
            for (const item of order.items) {
                invoice.addItem(
                    item.name || 'Article',
                    item.quantity,
                    item.price,
                    item.price * item.quantity,
                    ''
                );
            }

            // Set total amount (PayDunya requires explicit total)
            invoice.totalAmount = order.amount;

            // Set description
            invoice.description = `Commande ${order.orderNumber} - NUBIA AURA`;

            // Configure URLs
            invoice.returnURL = `${appBaseUrl}/${locale}/payments/callback?orderId=${order.orderId}&status=success&gateway=paydunya`;
            invoice.cancelURL = `${appBaseUrl}/${locale}/payments/callback?orderId=${order.orderId}&status=cancelled&gateway=paydunya`;
            invoice.callbackURL = `${appBaseUrl}/api/webhooks/paydunya`;

            // Add custom data for order tracking
            invoice.addCustomData('order_id', order.orderId);
            invoice.addCustomData('order_number', order.orderNumber);
            invoice.addCustomData('customer_email', order.customer.email);
            invoice.addCustomData('customer_phone', order.customer.phone);
            invoice.addCustomData('customer_name', `${order.customer.firstName} ${order.customer.lastName}`);

            // Add shipping taxes if applicable (for display purposes)
            // The total already includes shipping, this is just for display

            // Restrict payment channels if specific method requested
            if (method && CHANNEL_MAP[method]) {
                invoice.addChannel(CHANNEL_MAP[method]);
            }

            console.log('[PayDunya] Initializing payment:', {
                orderId: order.orderId,
                orderNumber: order.orderNumber,
                amount: order.amount,
                currency: order.currency,
                method: method || 'all',
                mode: PAYDUNYA_MODE,
            });

            // Create the invoice
            await invoice.create();

            if (invoice.status === 'success' || invoice.url) {
                console.log('[PayDunya] Payment session created:', {
                    token: invoice.token,
                    url: invoice.url?.substring(0, 50) + '...',
                });

                return {
                    success: true,
                    gateway: this.gateway,
                    transactionId: invoice.token,
                    redirectUrl: invoice.url,
                };
            } else {
                console.error('[PayDunya] Invoice creation failed:', {
                    status: invoice.status,
                    responseText: invoice.responseText,
                });

                return {
                    success: false,
                    gateway: this.gateway,
                    error: invoice.responseText || 'Erreur lors de la création de la facture PayDunya',
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

            this.initializeSDK();

            const invoice = new paydunya.CheckoutInvoice(this.setup, this.store);
            await invoice.confirm(token);

            switch (invoice.status) {
                case 'completed':
                    return 'paid';
                case 'cancelled':
                    return 'cancelled';
                case 'pending':
                default:
                    return 'pending';
            }
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

            this.initializeSDK();

            const invoice = new paydunya.CheckoutInvoice(this.setup, this.store);
            await invoice.confirm(token);

            const status: PaymentStatus = invoice.status === 'completed' ? 'paid' :
                invoice.status === 'cancelled' ? 'cancelled' : 'pending';

            return {
                success: invoice.status === 'completed',
                status,
                customer: invoice.customer,
                receiptUrl: invoice.receiptURL,
                orderId: invoice.customData?.order_id,
            };
        } catch (error) {
            console.error('[PayDunya] Confirm payment error:', error);
            return { success: false, status: 'pending' };
        }
    }
}

// Export singleton instance
export const paydunyaProvider = new PaydunyaProvider();
