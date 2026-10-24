// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { getSentryEnvironment } from '../../packages/core/src/utilities/env'

Sentry.init({
  // Both apps report to the same Sentry project; tag events with the app they came from
  initialScope: { tags: { app: 'web' } },

  dsn: process.env.SENTRY_DSN,

  environment: getSentryEnvironment(),

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Add the console logging integration
  integrations: [Sentry.consoleLoggingIntegration({ levels: ['log', 'error', 'warn', 'info', 'debug'] })],

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
})
