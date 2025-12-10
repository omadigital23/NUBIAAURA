/**
 * Sentry Configuration for NUBIA AURA
 * 
 * Centralized configuration for error monitoring
 */

export const sentryConfig = {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Release version (use git commit hash in production)
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev',

    // Sample rate for performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Sample rate for session replay
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

    // Sample rate for errors
    replaysOnErrorSampleRate: 1.0,

    // Debug mode
    debug: process.env.NODE_ENV === 'development',

    // Ignore certain errors
    ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',

        // Network errors that are expected
        'NetworkError',
        'Failed to fetch',
        'Load failed',

        // User cancelled actions
        'AbortError',
        'The user aborted a request',

        // Common third-party errors
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
    ],

    // Before send hook to filter/modify events
    beforeSend(event: any, hint: any) {
        // Don't send events in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Sentry Event (dev only):', event, hint);
            return null;
        }

        // Filter out events with no stack trace
        if (hint?.originalException && !hint.originalException.stack) {
            return null;
        }

        // Scrub sensitive data
        if (event.request) {
            // Remove sensitive headers
            if (event.request.headers) {
                delete event.request.headers['Authorization'];
                delete event.request.headers['Cookie'];
                delete event.request.headers['X-API-Key'];
            }

            // Remove sensitive query params
            if (event.request.query_string) {
                event.request.query_string = event.request.query_string
                    .replace(/token=[^&]*/g, 'token=[REDACTED]')
                    .replace(/password=[^&]*/g, 'password=[REDACTED]')
                    .replace(/api_key=[^&]*/g, 'api_key=[REDACTED]');
            }
        }

        // Scrub sensitive data from breadcrumbs
        if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map((breadcrumb: any) => {
                if (breadcrumb.data) {
                    // Remove sensitive fields
                    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
                    sensitiveFields.forEach(field => {
                        if (breadcrumb.data[field]) {
                            breadcrumb.data[field] = '[REDACTED]';
                        }
                    });
                }
                return breadcrumb;
            });
        }

        return event;
    },
};

/**
 * Helper to check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
    return !!(process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === 'production');
}

/**
 * Custom error tags for better categorization
 */
export const ErrorTags = {
    AUTH: 'auth',
    PAYMENT: 'payment',
    CART: 'cart',
    CHECKOUT: 'checkout',
    PRODUCT: 'product',
    ORDER: 'order',
    ADMIN: 'admin',
    DATABASE: 'database',
    API: 'api',
} as const;

/**
 * Error severity levels
 */
export const ErrorSeverity = {
    FATAL: 'fatal',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    DEBUG: 'debug',
} as const;
