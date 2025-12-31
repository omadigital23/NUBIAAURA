/**
 * Payment System Types
 * Unified type definitions for PayDunya + Airwallex + COD payment system
 */

// =========================================
// Enums & Constants
// =========================================

// UEMOA countries using XOF (PayTech)
export const UEMOA_COUNTRIES = ['SN', 'CI', 'ML', 'BJ', 'BF', 'TG', 'NE', 'GW'];

// European countries using EUR (Airwallex)
export const EUROPEAN_COUNTRIES = [
    'FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'AT', 'IE', 'FI',
    'GR', 'LU', 'SK', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT'
];

export type CountryCode = 'MA' | 'UEMOA' | 'EU' | 'OTHER';

export type Currency = 'MAD' | 'XOF' | 'USD' | 'EUR';

export type PaymentGateway = 'paydunya' | 'airwallex' | 'cod';

export type PaymentMethodType =
    | 'paydunya_wave'    // PayDunya - Wave (UEMOA)
    | 'paydunya_om'      // PayDunya - Orange Money (UEMOA)
    | 'paydunya_fm'      // PayDunya - Free Money (Senegal)
    | 'paydunya_mtn'     // PayDunya - MTN Money (Côte d'Ivoire, Benin)
    | 'paydunya_moov'    // PayDunya - Moov Money (Côte d'Ivoire, Mali, Benin)
    | 'paydunya_wizall'  // PayDunya - Wizall (Senegal)
    | 'paydunya_card'    // PayDunya - Cards (Visa, Mastercard)
    | 'airwallex_card'   // Airwallex - Cards (MA, EU, International)
    | 'cod';             // Cash on Delivery (everywhere)

export type PaymentStatus =
    | 'pending'          // Initial state
    | 'processing'       // Payment in progress
    | 'awaiting_payment' // COD - waiting for delivery
    | 'paid'             // Successfully paid
    | 'failed'           // Payment failed
    | 'cancelled'        // Cancelled by user
    | 'refunded';        // Refunded

// Country to gateway mapping
// PayDunya for UEMOA (Senegal, Côte d'Ivoire, Mali, Benin, etc.)
// Airwallex for Morocco, Europe, and International
export const COUNTRY_GATEWAY_MAP: Record<CountryCode, PaymentGateway[]> = {
    MA: ['airwallex', 'cod'],          // Morocco: Airwallex + COD
    UEMOA: ['paydunya', 'cod'],        // UEMOA (SN, CI, ML, BJ...): PayDunya + COD
    EU: ['airwallex', 'cod'],          // Europe: Airwallex + COD
    OTHER: ['airwallex', 'cod'],       // International: Airwallex + COD
};

// Country to currency mapping
export const COUNTRY_CURRENCY_MAP: Record<CountryCode, Currency> = {
    MA: 'MAD',
    UEMOA: 'XOF',
    EU: 'EUR',
    OTHER: 'USD',
};

/**
 * Check if a country code is in UEMOA zone
 */
export function isUEMOACountry(country: string): boolean {
    return UEMOA_COUNTRIES.includes(country.toUpperCase());
}

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

    // For redirect-based payments (PayTech, Airwallex)
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
// PayDunya Types - UEMOA Only
// =========================================

export interface PaydunyaConfig {
    masterKey: string;
    privateKey: string;
    publicKey: string;
    token: string;
    mode: 'test' | 'live';
}

export interface PaydunyaInvoice {
    token: string;
    total_amount: number;
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
}

export interface PaydunyaWebhookPayload {
    data: {
        hash: string;  // SHA-512 of MasterKey for verification
        status: 'pending' | 'completed' | 'cancelled';
        response_code: string;
        response_text: string;
        invoice: PaydunyaInvoice;
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



// =========================================
// Airwallex Types - Morocco, Europe, International
// =========================================

export interface AirwallexConfig {
    clientId: string;
    apiKey: string;
    env: 'demo' | 'prod';
}

export interface AirwallexPaymentIntentRequest {
    request_id: string;
    amount: number;
    currency: 'MAD' | 'EUR' | 'USD';
    merchant_order_id: string;
    order?: {
        type: 'physical_goods' | 'digital_goods' | 'service';
    };
    metadata?: Record<string, string>;
    return_url: string;
    descriptor?: string;
}

export interface AirwallexWebhookPayload {
    id: string;
    name: string; // 'payment_intent.succeeded', 'payment_intent.cancelled', etc.
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
        availableGateways: ['airwallex', 'cod'],
        availableMethods: ['airwallex_card', 'cod'],
    },
    UEMOA: {
        code: 'UEMOA',
        name: 'Afrique de l\'Ouest (UEMOA)',
        currency: 'XOF',
        availableGateways: ['paydunya', 'cod'],
        availableMethods: ['paydunya_wave', 'paydunya_om', 'paydunya_fm', 'paydunya_mtn', 'paydunya_moov', 'paydunya_wizall', 'paydunya_card', 'cod'],
    },
    EU: {
        code: 'EU',
        name: 'Europe',
        currency: 'EUR',
        availableGateways: ['airwallex', 'cod'],
        availableMethods: ['airwallex_card', 'cod'],
    },
    OTHER: {
        code: 'OTHER',
        name: 'International',
        currency: 'USD',
        availableGateways: ['airwallex', 'cod'],
        availableMethods: ['airwallex_card', 'cod'],
    },
};

/**
 * Get country code from country string/code
 */
export function getCountryCode(country: string): CountryCode {
    const code = country.toUpperCase();

    // Morocco
    if (code === 'MA' || code === 'MAROC' || code === 'MOROCCO') return 'MA';

    // UEMOA countries (Senegal, Côte d'Ivoire, Mali, Benin, etc.) - Use PayDunya
    if (isUEMOACountry(code)) return 'UEMOA';

    // European countries - Use Airwallex
    if (isEuropeanCountry(code)) return 'EU';

    // Rest of world - Use PayDunya (Card)
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

/**
 * Get the primary gateway for a country
 */
export function getPrimaryGatewayForCountry(country: string): PaymentGateway {
    const code = getCountryCode(country);
    const gateways = COUNTRY_GATEWAY_MAP[code];
    // Return first non-COD gateway, or COD if it's the only option
    return gateways.find(g => g !== 'cod') || 'cod';
}
