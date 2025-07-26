import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d945358f21d8cc73ed5efd69996a3050@o4509728862568448.ingest.us.sentry.io/4509728863813632",

  _experiments: {
    enableLogs: true,
  },

  integrations: [
    // send console.log, console.error, and console.warn calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],

  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
}); 