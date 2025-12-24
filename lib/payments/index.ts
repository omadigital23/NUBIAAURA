/**
 * Payment System - Unified Exports
 * 
 * Architecture:
 * - Chaabi Payment (Morocco - MAD)
 * - PayTech (Senegal - XOF, International - USD)
 * - COD (Cash on Delivery - everywhere)
 */

// Types
export * from './types';

// Providers
export { ChaabiProvider, chaabiProvider } from './providers/chaabi.provider';
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
