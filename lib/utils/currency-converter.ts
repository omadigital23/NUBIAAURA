/**
 * Currency Conversion Utility
 * 
 * Converts prices from XOF (base currency) to target currency based on country.
 * - West Africa (SN, CI, ML, BJ): XOF (FCFA)
 * - Morocco (MA): MAD
 * - Europe (FR, DE, ES, IT, BE, CH, etc.): EUR
 * - Rest of world: USD
 */

// Exchange rates (XOF as base)
// These are approximate rates - update as needed
// 1 EUR ≈ 656 XOF
// 1 USD ≈ 615 XOF  
// 1 MAD ≈ 60 XOF
export const EXCHANGE_RATES: Record<string, number> = {
    XOF: 1,        // Base currency
    EUR: 656,      // 1 EUR = 656 XOF
    USD: 615,      // 1 USD = 615 XOF
    MAD: 60,       // 1 MAD = 60 XOF
};

// Currency symbols and formatting
export const CURRENCY_INFO: Record<string, { symbol: string; name: string; locale: string }> = {
    XOF: { symbol: 'FCFA', name: 'Franc CFA', locale: 'fr-SN' },
    EUR: { symbol: '€', name: 'Euro', locale: 'fr-FR' },
    USD: { symbol: '$', name: 'Dollar US', locale: 'en-US' },
    MAD: { symbol: 'DH', name: 'Dirham', locale: 'fr-MA' },
};

// West African countries using XOF
const WEST_AFRICA_COUNTRIES = ['SN', 'CI', 'ML', 'BJ', 'BF', 'TG', 'NE', 'GW'];

// European countries using EUR
const EUROPEAN_COUNTRIES = [
    'FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'AT', 'IE', 'FI',
    'GR', 'LU', 'SK', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT'
];

// Morocco
const MOROCCO_COUNTRY = 'MA';

/**
 * Get currency code based on country
 */
export function getCurrencyForCountry(countryCode: string): string {
    const code = countryCode.toUpperCase();

    // West Africa - XOF
    if (WEST_AFRICA_COUNTRIES.includes(code)) {
        return 'XOF';
    }

    // Morocco - MAD
    if (code === MOROCCO_COUNTRY) {
        return 'MAD';
    }

    // Europe - EUR
    if (EUROPEAN_COUNTRIES.includes(code)) {
        return 'EUR';
    }

    // Rest of world - USD
    return 'USD';
}

/**
 * Convert price from XOF to target currency
 */
export function convertFromXOF(amountXOF: number, targetCurrency: string): number {
    const rate = EXCHANGE_RATES[targetCurrency];
    if (!rate) return amountXOF;

    // Round to nearest whole number for MAD, 2 decimals for EUR/USD
    const converted = amountXOF / rate;

    if (targetCurrency === 'XOF' || targetCurrency === 'MAD') {
        return Math.round(converted);
    }

    return Math.round(converted * 100) / 100;
}

/**
 * Convert price to XOF from source currency
 */
export function convertToXOF(amount: number, sourceCurrency: string): number {
    const rate = EXCHANGE_RATES[sourceCurrency];
    if (!rate) return amount;

    return Math.round(amount * rate);
}

/**
 * Format price with currency symbol
 */
export function formatPriceWithCurrency(
    amount: number,
    currency: string,
    locale: 'fr' | 'en' = 'fr'
): string {
    const info = CURRENCY_INFO[currency] || CURRENCY_INFO.XOF;

    const formatted = new Intl.NumberFormat(info.locale, {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: currency === 'EUR' || currency === 'USD' ? 2 : 0,
    }).format(amount);

    // For EUR, symbol comes after in French, before in English
    if (currency === 'EUR') {
        return locale === 'fr' ? `${formatted} ${info.symbol}` : `${info.symbol}${formatted}`;
    }

    // For USD, symbol comes before
    if (currency === 'USD') {
        return `${info.symbol}${formatted}`;
    }

    // For XOF and MAD, symbol comes after
    return `${formatted} ${info.symbol}`;
}

/**
 * Get full price conversion info for a country
 */
export function getPriceForCountry(
    amountXOF: number,
    countryCode: string,
    locale: 'fr' | 'en' = 'fr'
): {
    originalXOF: number;
    currency: string;
    amount: number;
    formatted: string;
} {
    const currency = getCurrencyForCountry(countryCode);
    const amount = convertFromXOF(amountXOF, currency);
    const formatted = formatPriceWithCurrency(amount, currency, locale);

    return {
        originalXOF: amountXOF,
        currency,
        amount,
        formatted,
    };
}

/**
 * Get country region for display
 */
export function getCountryRegion(countryCode: string): 'west_africa' | 'morocco' | 'europe' | 'international' {
    const code = countryCode.toUpperCase();

    if (WEST_AFRICA_COUNTRIES.includes(code)) return 'west_africa';
    if (code === MOROCCO_COUNTRY) return 'morocco';
    if (EUROPEAN_COUNTRIES.includes(code)) return 'europe';
    return 'international';
}
