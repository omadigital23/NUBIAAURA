/**
 * PayTech Payment Service
 * For Senegal: Orange Money, Wave, UEMOA cards
 * 
 * API Documentation: https://paytech.sn/documentation
 */

import axios from 'axios';

const PAYTECH_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://paytech.sn/api/payment/request-payment'
    : 'https://paytech.sn/api/payment/request-payment'; // Same URL, test mode via API key

const PAYTECH_API_KEY = process.env.PAYTECH_API_KEY;
const PAYTECH_SECRET_KEY = process.env.PAYTECH_SECRET_KEY;

export interface PaytechPaymentPayload {
    ref_command: string;           // Unique order reference
    amount: number;                // Amount in XOF (FCFA)
    currency: 'XOF';
    command_name: string;          // Order description
    customer_email: string;
    customer_phone: string;
    customer_name: string;
    success_url: string;           // Redirect URL on success
    cancel_url: string;            // Redirect URL on cancel
    ipn_url: string;               // Webhook URL (Instant Payment Notification)
}

export interface PaytechResponse {
    success: boolean;
    redirect_url?: string;
    token?: string;
    error?: string;
}

export interface PaytechWebhookPayload {
    ref_command: string;
    item_name: string;
    amount: string;
    payment_method: string;
    client_phone: string;
    client_email: string;
    env: 'test' | 'prod';
    type_event: 'sale_complete' | 'sale_canceled';
    custom_field?: string;
    api_key_sha256: string;        // Hash for verification
    api_secret_sha256: string;     // Hash for verification
}

/**
 * Check if PayTech is configured
 */
export function isPaytechConfigured(): boolean {
    return !!(PAYTECH_API_KEY && PAYTECH_SECRET_KEY);
}

/**
 * Initialize a payment with PayTech
 */
export async function initializePaytechPayment(payload: PaytechPaymentPayload): Promise<PaytechResponse> {
    try {
        if (!isPaytechConfigured()) {
            console.warn('[PayTech] API keys not configured');
            return {
                success: false,
                error: 'PayTech n\'est pas configuré. Veuillez utiliser le paiement à la livraison.',
            };
        }

        console.log('[PayTech] Initializing payment:', {
            ref: payload.ref_command,
            amount: payload.amount,
            currency: payload.currency,
        });

        const response = await axios.post(
            PAYTECH_BASE_URL,
            {
                item_name: payload.command_name,
                item_price: payload.amount,
                currency: payload.currency,
                ref_command: payload.ref_command,
                command_name: payload.command_name,
                env: process.env.NODE_ENV === 'production' ? 'prod' : 'test',
                success_url: payload.success_url,
                cancel_url: payload.cancel_url,
                ipn_url: payload.ipn_url,
                custom_field: JSON.stringify({
                    customer_email: payload.customer_email,
                    customer_phone: payload.customer_phone,
                    customer_name: payload.customer_name,
                }),
            },
            {
                headers: {
                    'API_KEY': PAYTECH_API_KEY,
                    'API_SECRET': PAYTECH_SECRET_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 15000,
            }
        );

        if (response.data.success === 1) {
            console.log('[PayTech] Payment initialized successfully');
            return {
                success: true,
                redirect_url: response.data.redirect_url,
                token: response.data.token,
            };
        } else {
            console.error('[PayTech] Payment initialization failed:', response.data);
            return {
                success: false,
                error: response.data.message || 'Erreur lors de l\'initialisation du paiement',
            };
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[PayTech] Error:', errorMessage);
        return {
            success: false,
            error: 'Erreur de connexion à PayTech. Veuillez réessayer.',
        };
    }
}

/**
 * Verify PayTech webhook signature
 */
export function verifyPaytechWebhook(payload: PaytechWebhookPayload): boolean {
    if (!PAYTECH_API_KEY || !PAYTECH_SECRET_KEY) {
        return false;
    }

    // PayTech sends SHA256 hashes of API key and secret
    const crypto = require('crypto');
    const expectedApiKeyHash = crypto.createHash('sha256').update(PAYTECH_API_KEY).digest('hex');
    const expectedSecretHash = crypto.createHash('sha256').update(PAYTECH_SECRET_KEY).digest('hex');

    return (
        payload.api_key_sha256 === expectedApiKeyHash &&
        payload.api_secret_sha256 === expectedSecretHash
    );
}

/**
 * Check if payment was successful from webhook
 */
export function isPaytechPaymentSuccessful(payload: PaytechWebhookPayload): boolean {
    return payload.type_event === 'sale_complete';
}
