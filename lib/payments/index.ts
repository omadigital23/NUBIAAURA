/**
 * Payment System - Unified Exports
 * 
 * Architecture:
 * - PayTech (Senegal - XOF, Morocco - MAD, International - USD/EUR)
 * - COD (Cash on Delivery - everywhere)
 */

// Types
export * from './types';

// Providers
export { PaytechProvider, paytechProvider } from './providers/paytech.provider';
export { CODProvider, codProvider } from './providers/cod.provider';

// Factory
export {
    PaymentProviderFactory,
    getProvider,
    getPrimaryProviderForCountry,
    getProvidersForCountry,
    isGatewayAvailableForCountry,
} from './provider-factory';
