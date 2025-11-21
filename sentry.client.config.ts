import * as Sentry from '@sentry/nextjs';
import { sentryConfig } from './lib/sentry-config';

// Initialize Sentry for client-side error monitoring
if (sentryConfig.dsn) {
  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    release: sentryConfig.release,

    // Performance monitoring
    tracesSampleRate: sentryConfig.tracesSampleRate,

    // Session replay
    replaysSessionSampleRate: sentryConfig.replaysSessionSampleRate,
    replaysOnErrorSampleRate: sentryConfig.replaysOnErrorSampleRate,

    // Debug mode
    debug: sentryConfig.debug,

    // Ignore certain errors
    ignoreErrors: sentryConfig.ignoreErrors,

    // Before send hook
    beforeSend: sentryConfig.beforeSend,

    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        // Track navigation performance
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.vercel\.app/,
          process.env.NEXT_PUBLIC_APP_URL || '',
        ].filter(Boolean),
      }),
      new Sentry.Replay({
        // Privacy settings for session replay
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}
