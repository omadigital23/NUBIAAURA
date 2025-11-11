import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus, capture 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Set `tracePropagationTargets` to control what URLs distributed tracing should be enabled for
  tracePropagationTargets: [
    'localhost',
    /^\//,
    // Regex match to include your server
    /^https:\/\/yourserver\.io\/api/,
  ],

  // Capture Replay for 10% of all sessions,
  // plus, capture 100% of sessions with an error
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  environment: process.env.NODE_ENV,
  
  beforeSend(event: any, hint: any) {
    // Filter out certain errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Don't send 404 errors
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
    }
    
    return event;
  },
});
