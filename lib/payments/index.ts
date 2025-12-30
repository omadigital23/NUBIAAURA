/**
 * Payment System - Unified Exports
 * 
 * Architecture:
 * - PayTech (UEMOA - Senegal, Côte d'Ivoire, Mali, Benin - XOF)
 * - Airwallex (Morocco - MAD, Europe - EUR, International - USD)
 * - COD (Cash on Delivery - everywhere)
 */

// Types
export * from './types';

// Providers
export { PaytechProvider, paytechProvider } from './providers/paytech.provider';
export { AirwallexProvider, airwallexProvider } from './providers/airwallex.provider';
export type { AirwallexWebhookPayload } from './providers/airwallex.provider';
export { CODProvider, codProvider } from './providers/cod.provider';

// Factory
export {
    PaymentProviderFactory,
    getProvider,
    getPrimaryProviderForCountry,
    getProvidersForCountry,
    isGatewayAvailableForCountry,
} from './provider-factory';
