// @ts-check
import { fileURLToPath } from 'node:url'

import sentry from '@sentry/astro'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import { isrBypassToken } from './src/lib/isr.mjs'

const coreSrc = fileURLToPath(new URL('../../packages/core/src', import.meta.url))

// Production builds fail early instead of deploying a site that cannot reach the CMS
if (process.env.VERCEL_ENV === 'production') {
  const missing = ['NEXT_PUBLIC_CMS_URL', 'REVALIDATION_SECRET'].filter((name) => !process.env[name])
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
}

const sentryEnvironment =
  { production: 'production', preview: 'staging' }[process.env.VERCEL_ENV ?? ''] ?? 'development'
const hasSentryDSN = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)

// Every route is rendered on demand (draft preview needs the request's cookies) and the HTML is
// cached by Vercel ISR. The CMS re-renders changed paths through /api/revalidate, which sends the
// bypass token; `expiration` is a safety net for pages that list other documents (archive blocks,
// paginated post lists).
export default defineConfig({
  output: 'server',
  site: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  // Astro 7 strips whitespace between inline elements by default ('jsx'); keep the HTML-aware behaviour
  compressHTML: true,
  adapter: vercel({
    webAnalytics: { enabled: true },
    isr: {
      bypassToken: isrBypassToken(process.env.REVALIDATION_SECRET),
      // ISR ignores the query string, so routes that read it must not be cached
      exclude: [/^\/api\//, /^\/next\//, '/search'],
      expiration: 600,
    },
  }),
  integrations: [
    sentry({
      enabled: { client: hasSentryDSN, server: hasSentryDSN },
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
      telemetry: false,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { '@zeus/core': coreSrc },
    },
    define: {
      // The browser SDK reads the DSN that the Next.js app exposed as NEXT_PUBLIC_SENTRY_DSN
      'import.meta.env.PUBLIC_SENTRY_DSN': JSON.stringify(process.env.NEXT_PUBLIC_SENTRY_DSN || ''),
      // Resolved at build time because VERCEL_ENV does not exist in the browser
      'import.meta.env.PUBLIC_SENTRY_ENVIRONMENT': JSON.stringify(sentryEnvironment),
    },
  },
})
