import * as Sentry from '@sentry/astro'

Sentry.init({
  // Both apps report to the same Sentry project; tag events with the app they came from
  initialScope: { tags: { app: 'web' } },
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  environment: import.meta.env.PUBLIC_SENTRY_ENVIRONMENT,
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: 1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
})
