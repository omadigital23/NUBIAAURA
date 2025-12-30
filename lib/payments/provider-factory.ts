/**
 * Payment Provider Factory
 * Creates the appropriate provider based on country and method
 * Supports: PayTech (UEMOA) + Airwallex (Morocco, Europe, International) + COD
 */

import {
    IPaymentProvider,
    PaymentGateway,
    getCountryCode,
    COUNTRY_GATEWAY_MAP,
} from './types';
import { paytechProvider } from './providers/paytech.provider';
import { airwallexProvider } from './providers/airwallex.provider';
import { codProvider } from './providers/cod.provider';

// Provider registry
const PROVIDERS: Record<PaymentGateway, IPaymentProvider> = {
    paytech: paytechProvider,
    airwallex: airwallexProvider,
    cod: codProvider,
};

/**
 * Get the appropriate payment provider for a country and gateway
 */
export function getProvider(gateway: PaymentGateway): IPaymentProvider {
    const provider = PROVIDERS[gateway];
    if (!provider) {
        throw new Error(`Unknown payment gateway: ${gateway}`);
    }
    return provider;
}

/**
 * Get the primary (non-COD) payment provider for a country
 */
export function getPrimaryProviderForCountry(country: string): IPaymentProvider {
    const countryCode = getCountryCode(country);

    // Get available gateways for the country (excluding COD)
    const gateways = COUNTRY_GATEWAY_MAP[countryCode].filter(g => g !== 'cod');

    if (gateways.length === 0) {
        throw new Error(`No payment provider available for country: ${country}`);
    }

    // Return the first available (primary) gateway
    return getProvider(gateways[0]);
}

/**
 * Get all available providers for a country
 */
export function getProvidersForCountry(country: string): IPaymentProvider[] {
    const countryCode = getCountryCode(country);
    const gateways = COUNTRY_GATEWAY_MAP[countryCode];

    return gateways.map(gateway => getProvider(gateway));
}

/**
 * Check if a specific gateway is available for a country
 */
export function isGatewayAvailableForCountry(
    gateway: PaymentGateway,
    country: string
): boolean {
    const countryCode = getCountryCode(country);
    return COUNTRY_GATEWAY_MAP[countryCode].includes(gateway);
}

/**
 * Factory class for creating payment providers
 */
export class PaymentProviderFactory {
    /**
     * Create a provider based on gateway type
     */
    static create(gateway: PaymentGateway): IPaymentProvider {
        return getProvider(gateway);
    }

    /**
     * Create the primary provider for a country
     */
    static createForCountry(country: string): IPaymentProvider {
        return getPrimaryProviderForCountry(country);
    }

    /**
     * Get all available providers for a country
     */
    static getAvailable(country: string): IPaymentProvider[] {
        return getProvidersForCountry(country);
    }

    /**
     * Check provider configuration status
     */
    static getConfigurationStatus(): Record<PaymentGateway, boolean> {
        return {
            paytech: paytechProvider.isConfigured(),
            airwallex: airwallexProvider.isConfigured(),
            cod: codProvider.isConfigured(),
        };
    }
}

// Export default factory instance
export default PaymentProviderFactory;
