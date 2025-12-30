/**
 * Payment System Types
 * Unified type definitions for PayTech + COD payment system
 */

// =========================================
// Enums & Constants
// =========================================

export type CountryCode = 'MA' | 'SN' | 'EU' | 'OTHER';

export type Currency = 'MAD' | 'XOF' | 'USD' | 'EUR';

export type PaymentGateway = 'paytech' | 'cod';

export type PaymentMethodType =
    | 'paytech_wave'     // PayTech - Wave (Senegal)
    | 'paytech_om'       // PayTech - Orange Money (Senegal)
    | 'paytech_fm'       // PayTech - Free Money (Senegal)
    | 'paytech_card'     // PayTech - International cards (USD/EUR/MAD)
    | 'cod';             // Cash on Delivery (everywhere)

export type PaymentStatus =
    | 'pending'          // Initial state
    | 'processing'       // Payment in progress
    | 'awaiting_payment' // COD - waiting for delivery
    | 'paid'             // Successfully paid
    | 'failed'           // Payment failed
    | 'cancelled'        // Cancelled by user
    | 'refunded';        // Refunded

// European countries using EUR
const EUROPEAN_COUNTRIES = [
    'FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'AT', 'IE', 'FI',
    'GR', 'LU', 'SK', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT'
];

// Country to gateway mapping - PayTech for all countries
export const COUNTRY_GATEWAY_MAP: Record<CountryCode, PaymentGateway[]> = {
    MA: ['paytech', 'cod'],          // Morocco: PayTech + COD
    SN: ['paytech', 'cod'],          // Senegal: PayTech + COD
    EU: ['paytech', 'cod'],          // Europe: PayTech (cards) + COD
    OTHER: ['paytech', 'cod'],       // International: PayTech (cards) + COD
};

// Country to currency mapping
export const COUNTRY_CURRENCY_MAP: Record<CountryCode, Currency> = {
    MA: 'MAD',
    SN: 'XOF',
    EU: 'EUR',
    OTHER: 'USD',
};

/**
 * Check if a country code is European
 */
export function isEuropeanCountry(country: string): boolean {
    return EUROPEAN_COUNTRIES.includes(country.toUpperCase());
}

// =========================================
// Interfaces
// =========================================

/**
 * Order payload for payment initialization
 */
export interface OrderPayload {
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: Currency;
    customer: {
        email: string;
        phone: string;
        firstName: string;
        lastName: string;
    };
    shipping: {
        address: string;
        city: string;
        zipCode?: string;
        country: string;
    };
    items: Array<{
        productId: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    locale: 'fr' | 'en';
}

/**
 * Payment session returned after initialization
 */
export interface PaymentSession {
    success: boolean;
    gateway: PaymentGateway;
    transactionId?: string;

    // For redirect-based payments (PayTech)
    redirectUrl?: string;

    // For form-based payments (legacy support)
    formData?: Record<string, string>;
    gatewayUrl?: string;

    // For COD
    orderConfirmed?: boolean;

    // Error handling
    error?: string;
    errorCode?: string;
}

/**
 * Result of webhook/callback processing
 */
export interface CallbackResult {
    success: boolean;
    orderId: string;
    transactionId?: string;
    status: PaymentStatus;
    paymentMethod?: string;
    amount?: number;
    currency?: Currency;
    processedAt: string;
    rawPayload?: unknown;
    error?: string;
}

/**
 * Payment provider interface
 * All payment providers must implement this interface
 */
export interface IPaymentProvider {
    /**
     * Gateway identifier
     */
    readonly gateway: PaymentGateway;

    /**
     * Supported currencies
     */
    readonly supportedCurrencies: Currency[];

    /**
     * Check if the provider is properly configured
     */
    isConfigured(): boolean;

    /**
     * Create a payment session
     * @param order Order details
     * @param method Specific payment method (e.g., 'wave', 'orange_money')
     * @returns Payment session with redirect URL or form data
     */
    createSession(order: OrderPayload, method?: string): Promise<PaymentSession>;

    /**
     * Verify webhook signature
     * @param payload Raw webhook payload
     * @param signature Signature header or hash
     * @returns True if signature is valid
     */
    verifyWebhook(payload: unknown, signature?: string): boolean;

    /**
     * Handle webhook callback
     * @param payload Webhook payload
     * @returns Callback result with order status
     */
    handleCallback(payload: unknown): Promise<CallbackResult>;

    /**
     * Get payment status (optional - some gateways don't support this)
     * @param transactionId Transaction ID
     * @returns Current payment status
     */
    getStatus?(transactionId: string): Promise<PaymentStatus>;
}

// =========================================
// PayTech Types (Intech Group)
// =========================================

export interface PaytechConfig {
    apiKey: string;
    secretKey: string;
    env: 'test' | 'prod';
}

export interface PaytechPaymentRequest {
    item_name: string;
    item_price: number;
    currency: 'XOF' | 'USD' | 'EUR' | 'MAD';
    ref_command: string;
    command_name: string;
    env: 'test' | 'prod';
    ipn_url: string;
    success_url: string;
    cancel_url: string;
    custom_field?: string;
    target_payment?: string;  // 'wave', 'Orange Money', 'Free Money', etc.
}

export interface PaytechWebhookPayload {
    type_event: 'sale_complete' | 'sale_canceled';
    ref_command: string;
    item_name: string;
    item_price: string;
    payment_method: string;
    client_phone: string;
    client_email?: string;
    env: 'test' | 'prod';
    token: string;
    api_key_sha256: string;
    api_secret_sha256: string;
    hmac_compute?: string;  // HMAC-SHA256 (recommended method)
    custom_field?: string;
}

// =========================================
// COD Types
// =========================================

export interface CODConfig {
    requireOTP: boolean;
    maxAmount?: number;    // Maximum COD amount
}

export interface CODOrderData {
    orderId: string;
    amount: number;
    currency: Currency;
    customer: {
        phone: string;
        email: string;
        name: string;
    };
    shipping: {
        address: string;
        city: string;
        country: string;
    };
}

// =========================================
// Utility Types
// =========================================

export interface CountryInfo {
    code: CountryCode;
    name: string;
    currency: Currency;
    availableGateways: PaymentGateway[];
    availableMethods: PaymentMethodType[];
}

export const COUNTRY_INFO: Record<CountryCode, CountryInfo> = {
    MA: {
        code: 'MA',
        name: 'Maroc',
        currency: 'MAD',
        availableGateways: ['paytech', 'cod'],
        availableMethods: ['paytech_card', 'cod'],
    },
    SN: {
        code: 'SN',
        name: 'Sénégal',
        currency: 'XOF',
        availableGateways: ['paytech', 'cod'],
        availableMethods: ['paytech_wave', 'paytech_om', 'paytech_fm', 'cod'],
    },
    EU: {
        code: 'EU',
        name: 'Europe',
        currency: 'EUR',
        availableGateways: ['paytech', 'cod'],
        availableMethods: ['paytech_card', 'cod'],
    },
    OTHER: {
        code: 'OTHER',
        name: 'International',
        currency: 'USD',
        availableGateways: ['paytech', 'cod'],
        availableMethods: ['paytech_card', 'cod'],
    },
};

/**
 * Get country code from country string/code
 */
export function getCountryCode(country: string): CountryCode {
    const code = country.toUpperCase();
    if (code === 'MA' || code === 'MAROC' || code === 'MOROCCO') return 'MA';
    if (code === 'SN' || code === 'SENEGAL' || code === 'SÉNÉGAL') return 'SN';
    // Check if European country
    if (isEuropeanCountry(code)) return 'EU';
    return 'OTHER';
}

/**
 * Get currency for a country
 */
export function getCurrencyForCountry(country: string): Currency {
    const code = getCountryCode(country);
    return COUNTRY_CURRENCY_MAP[code];
}

/**
 * Get available payment methods for a country
 */
export function getPaymentMethodsForCountry(country: string): PaymentMethodType[] {
    const code = getCountryCode(country);
    return COUNTRY_INFO[code].availableMethods;
}
