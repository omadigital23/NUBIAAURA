/**
 * CMI Payment Service
 * For Morocco: Visa, Mastercard, local cards
 * 
 * CMI (Centre Monétique Interbancaire) - Payzone
 */

import crypto from 'crypto';

const CMI_STORE_ID = process.env.CMI_STORE_ID;
const CMI_SECRET_KEY = process.env.CMI_SECRET_KEY;
const CMI_GATEWAY_URL = 'https://payment.cmi.co.ma/fim/est3Dgate';

export interface CMIPaymentPayload {
    orderId: string;              // Unique order reference
    amount: number;               // Amount in MAD (centimes: 100 = 1 MAD)
    currency: 'MAD';
    customerEmail: string;
    customerName: string;
    description: string;
    okUrl: string;                // Success redirect URL
    failUrl: string;              // Failure redirect URL
    callbackUrl: string;          // Webhook URL
}

export interface CMIFormData {
    clientid: string;
    storetype: string;
    trantype: string;
    amount: string;
    currency: string;
    oid: string;
    okUrl: string;
    failUrl: string;
    callbackUrl: string;
    TranType: string;
    email: string;
    BillToName: string;
    lang: string;
    encoding: string;
    hash: string;
    hashAlgorithm: string;
    rnd: string;
}

export interface CMIWebhookPayload {
    oid: string;                  // Order ID
    AuthCode: string;             // Authorization code
    Response: string;             // 'Approved' or 'Declined'
    ProcReturnCode: string;       // '00' for success
    TransId: string;              // Transaction ID
    mdStatus: string;             // 3D Secure status
    amount: string;
    currency: string;
    HASH: string;                 // Verification hash
    HASHPARAMS: string;
    HASHPARAMSVAL: string;
}

/**
 * Check if CMI is configured
 */
export function isCMIConfigured(): boolean {
    return !!(CMI_STORE_ID && CMI_SECRET_KEY);
}

/**
 * Generate CMI hash for form data
 */
function generateCMIHash(data: Record<string, string>, secretKey: string): string {
    // CMI uses a specific hash algorithm
    const hashParams = [
        'clientid',
        'oid',
        'amount',
        'okUrl',
        'failUrl',
        'TranType',
        'rnd',
    ];

    const hashString = hashParams.map(key => data[key] || '').join('') + secretKey;
    return crypto.createHash('sha512').update(hashString).digest('base64');
}

/**
 * Generate CMI payment form data
 */
export function generateCMIFormData(payload: CMIPaymentPayload): CMIFormData | null {
    if (!isCMIConfigured()) {
        console.warn('[CMI] API credentials not configured');
        return null;
    }

    const rnd = Date.now().toString();

    const formData: Partial<CMIFormData> = {
        clientid: CMI_STORE_ID!,
        storetype: '3D_PAY_HOSTING',
        trantype: 'Sale',
        amount: (payload.amount * 100).toString(), // Convert to centimes
        currency: '504', // MAD currency code
        oid: payload.orderId,
        okUrl: payload.okUrl,
        failUrl: payload.failUrl,
        callbackUrl: payload.callbackUrl,
        TranType: 'Sale',
        email: payload.customerEmail,
        BillToName: payload.customerName,
        lang: 'fr',
        encoding: 'UTF-8',
        rnd: rnd,
        hashAlgorithm: 'ver3',
    };

    // Generate hash
    formData.hash = generateCMIHash(formData as Record<string, string>, CMI_SECRET_KEY!);

    return formData as CMIFormData;
}

/**
 * Get CMI gateway URL
 */
export function getCMIGatewayURL(): string {
    return CMI_GATEWAY_URL;
}

/**
 * Verify CMI webhook signature
 */
export function verifyCMIWebhook(payload: CMIWebhookPayload): boolean {
    if (!CMI_SECRET_KEY) {
        return false;
    }

    try {
        // Verify using HASHPARAMS
        const hashParams = payload.HASHPARAMS.split(':');
        const hashParamsValue = hashParams.map(key => (payload as unknown as Record<string, string>)[key] || '').join('');

        const expectedHash = crypto
            .createHash('sha512')
            .update(hashParamsValue + CMI_SECRET_KEY)
            .digest('base64');

        return payload.HASH === expectedHash;
    } catch (error) {
        console.error('[CMI] Webhook verification error:', error);
        return false;
    }
}

/**
 * Check if CMI payment was successful
 */
export function isCMIPaymentSuccessful(payload: CMIWebhookPayload): boolean {
    return (
        payload.Response === 'Approved' &&
        payload.ProcReturnCode === '00' &&
        payload.mdStatus === '1'
    );
}
