/**
 * Payment System - Unified Exports
 * 
 * Architecture:
 * - PayDunya (All countries - Mobile Money for UEMOA, Cards everywhere)
 * - COD (Cash on Delivery - everywhere)
 */

// Types
export * from './types';

// Providers
export { PaydunyaProvider, paydunyaProvider } from './providers/paydunya.provider';
export type { PaydunyaWebhookPayload } from './providers/paydunya.provider';
export { CODProvider, codProvider } from './providers/cod.provider';

// Factory
export {
    PaymentProviderFactory,
    getProvider,
    getPrimaryProviderForCountry,
    getProvidersForCountry,
    isGatewayAvailableForCountry,
} from './provider-factory';

