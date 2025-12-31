/**
 * Country Detection Service
 * Detects user's country by IP for automatic payment gateway selection
 */

export type SupportedCountry = 'SN' | 'MA' | 'OTHER';

export interface CountryInfo {
    code: SupportedCountry;
    name: string;
    currency: string;
    paymentMethod: 'paydunya' | 'cod';
}

const COUNTRY_CONFIG: Record<SupportedCountry, CountryInfo> = {
    SN: {
        code: 'SN',
        name: 'Sénégal',
        currency: 'XOF',
        paymentMethod: 'paydunya',
    },
    MA: {
        code: 'MA',
        name: 'Maroc',
        currency: 'MAD',
        paymentMethod: 'paydunya',
    },
    OTHER: {
        code: 'OTHER',
        name: 'International',
        currency: 'XOF',
        paymentMethod: 'paydunya',
    },
};

/**
 * Detect country from IP using free IP geolocation API
 */
export async function detectCountryFromIP(ip?: string): Promise<CountryInfo> {
    try {
        // Use ipapi.co for free geolocation (1000 requests/day free)
        const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'NubiaAura/1.0',
            },
            // Timeout after 5 seconds
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            console.warn('[CountryDetection] IP API failed, defaulting to OTHER');
            return COUNTRY_CONFIG.OTHER;
        }

        const data = await response.json();
        const countryCode = data.country_code?.toUpperCase();

        // Check if it's a supported country
        if (countryCode === 'SN') {
            return COUNTRY_CONFIG.SN;
        } else if (countryCode === 'MA') {
            return COUNTRY_CONFIG.MA;
        }

        // Default to OTHER for unsupported countries
        return COUNTRY_CONFIG.OTHER;
    } catch (error) {
        console.error('[CountryDetection] Error detecting country:', error);
        return COUNTRY_CONFIG.OTHER;
    }
}

/**
 * Get country info from country code
 */
export function getCountryInfo(countryCode: string): CountryInfo {
    const code = countryCode.toUpperCase();
    if (code === 'SN') return COUNTRY_CONFIG.SN;
    if (code === 'MA') return COUNTRY_CONFIG.MA;
    return COUNTRY_CONFIG.OTHER;
}

/**
 * Get available payment methods for a country
 */
export function getAvailablePaymentMethods(countryCode: SupportedCountry): string[] {
    switch (countryCode) {
        case 'SN':
            return ['paydunya', 'cod'];
        case 'MA':
            return ['paydunya', 'cod'];
        default:
            return ['paydunya', 'cod'];
    }
}

/**
 * Get currency for a country
 */
export function getCurrencyForCountry(countryCode: SupportedCountry): string {
    return COUNTRY_CONFIG[countryCode]?.currency || 'XOF';
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string): string {
    if (currency === 'XOF') {
        return `${amount.toLocaleString('fr-FR')} FCFA`;
    } else if (currency === 'MAD') {
        return `${amount.toLocaleString('fr-FR')} MAD`;
    }
    return `${amount.toLocaleString('fr-FR')} ${currency}`;
}

export { COUNTRY_CONFIG };
