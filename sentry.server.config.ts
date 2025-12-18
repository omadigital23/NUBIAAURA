import * as Sentry from '@sentry/nextjs';
import { sentryConfig } from './lib/sentry-config';

// Initialize Sentry for server-side error monitoring
if (sentryConfig.dsn) {
    Sentry.init({
        dsn: sentryConfig.dsn,
        environment: sentryConfig.environment,
        release: sentryConfig.release,

        // Performance monitoring
        tracesSampleRate: sentryConfig.tracesSampleRate,

        // Debug mode
        debug: sentryConfig.debug,

        // Ignore certain errors
        ignoreErrors: sentryConfig.ignoreErrors,

        // Before send hook
        beforeSend: sentryConfig.beforeSend,

        // Server-specific integrations (Sentry v10 API)
        integrations: [
            Sentry.httpIntegration(),
        ],
    });
}
