import * as Sentry from '@sentry/astro'

import { getSentryEnvironment } from '@zeus/core/utilities/env'

Sentry.init({
  // Both apps report to the same Sentry project; tag events with the app they came from
  initialScope: { tags: { app: 'web' } },
  dsn: process.env.SENTRY_DSN,
  environment: getSentryEnvironment(),
  tracesSampleRate: 1,
  integrations: [Sentry.consoleLoggingIntegration({ levels: ['log', 'error', 'warn', 'info', 'debug'] })],
})
