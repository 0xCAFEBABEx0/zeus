import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs/config'
import path from 'path'
import { fileURLToPath } from 'url'

// Repository root: both apps compile sources from packages/core, which lives outside their own directory
const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * Shared Next.js configuration for apps/cms and apps/web.
 *
 * @param {import('next').NextConfig} nextConfig app-specific options
 * @param {{ requiredEnv?: string[] }} [options] env vars that must be set for production builds
 * @returns {import('next').NextConfig}
 */
export const createNextConfig = (nextConfig, { requiredEnv = [] } = {}) => {
  if (process.env.VERCEL_ENV === 'production') {
    const missing = requiredEnv.filter((name) => !process.env[name])
    if (missing.length) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }

  const baseConfig = {
    ...nextConfig,

    experimental: {
      // Enable Web Vitals tracking
      webVitalsAttribution: ['CLS', 'LCP'],
      ...nextConfig.experimental,
    },

    // Sentry v11 requires its runtime injection hooks to stay unbundled, even when withSentryConfig is not applied
    serverExternalPackages: [
      '@sentry/server-runtime-injection',
      ...(nextConfig.serverExternalPackages || []),
    ],

    // Enable standalone output for Docker
    output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

    // Trace and compile files from the whole monorepo (packages/core), not just the app directory
    outputFileTracingRoot: monorepoRoot,
    turbopack: {
      root: monorepoRoot,
      ...nextConfig.turbopack,
    },
  }

  // Check if Sentry should be enabled
  const shouldUseSentry = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  const hasSentryConfig = process.env.SENTRY_ORG && process.env.SENTRY_PROJECT

  // withPayload keeps Payload's server-only packages (drizzle-kit, esbuild, libsql, ...) out of the
  // Turbopack bundle, which Next.js 16 uses by default for both dev and build
  let finalConfig = withPayload(baseConfig, { devBundleServerPackages: false })

  if (shouldUseSentry && hasSentryConfig) {
    finalConfig = withSentryConfig(finalConfig, {
      // For all available options, see:
      // https://www.npmjs.com/package/@sentry/webpack-plugin#options

      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,

      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,

      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
      tunnelRoute: '/monitoring',

      // Source map configuration using newer options
      sourcemaps: {
        // Use improved source map handling
        disable: false,
        // Clean up source maps after upload for better security
        deleteSourcemapsAfterUpload: true,
      },

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
      },

      // Options that only apply to webpack builds (Next.js 16 builds with Turbopack by default)
      webpack: {
        // Enables automatic instrumentation of Vercel Cron Monitors
        automaticVercelMonitors: true,
      },
    })
  } else {
    console.warn('Sentry configuration incomplete - building without Sentry source map upload')
    if (shouldUseSentry && !hasSentryConfig) {
      console.info(
        'Set SENTRY_ORG and SENTRY_PROJECT environment variables to enable Sentry source maps',
      )
    }
  }

  return finalConfig
}
