/**
 * Tracking Configuration
 * Configure tracking behavior and integrations
 */

export const trackingConfig = {
  // Enable/disable tracking globally
  enabled: process.env.NEXT_PUBLIC_TRACKING_ENABLED !== 'false',

  // Google Analytics
  googleAnalytics: {
    enabled: !!process.env.NEXT_PUBLIC_GA_ID,
    id: process.env.NEXT_PUBLIC_GA_ID,
  },

  // Custom backend tracking
  backend: {
    enabled: process.env.NEXT_PUBLIC_TRACKING_BACKEND_ENABLED !== 'false',
    endpoint: '/api/tracking',
  },

  // Events to track
  events: {
    // Page events
    pageView: true,

    // Product events
    productView: true,
    productSearch: true,
    filterProducts: true,
    sortProducts: true,
    shareProduct: true,

    // Cart events
    addToCart: true,
    removeFromCart: true,
    viewCart: true,

    // Checkout events
    beginCheckout: true,
    addShippingInfo: true,
    addPaymentInfo: true,
    purchase: true,

    // User events
    userSignup: true,
    userLogin: true,
    userLogout: true,

    // Form events
    newsletterSignup: true,
    contactFormSubmit: true,
    customOrderSubmit: true,

    // Order events
    viewOrderDetails: true,
    initiateReturn: true,
  },

  // Sampling rate (0-1)
  // 1.0 = track 100% of events
  // 0.1 = track 10% of events
  samplingRate: process.env.NODE_ENV === 'production' ? 1.0 : 1.0,

  // Debug mode
  debug: process.env.NODE_ENV === 'development',

  // Privacy settings
  privacy: {
    // Anonymize IP addresses
    anonymizeIp: true,

    // Don't track if user has Do Not Track enabled
    respektDNT: true,

    // Cookie consent required
    cookieConsentRequired: true,
  },
};

/**
 * Check if an event should be tracked based on sampling rate
 */
export function shouldTrackEvent(): boolean {
  return Math.random() <= trackingConfig.samplingRate;
}

/**
 * Check if tracking is enabled
 */
export function isTrackingEnabled(): boolean {
  return trackingConfig.enabled;
}

/**
 * Check if Google Analytics is enabled
 */
export function isGoogleAnalyticsEnabled(): boolean {
  return trackingConfig.googleAnalytics.enabled;
}

/**
 * Check if backend tracking is enabled
 */
export function isBackendTrackingEnabled(): boolean {
  return trackingConfig.backend.enabled;
}

/**
 * Check if specific event should be tracked
 */
export function shouldTrackEventType(eventType: keyof typeof trackingConfig.events): boolean {
  return trackingConfig.events[eventType] === true;
}
