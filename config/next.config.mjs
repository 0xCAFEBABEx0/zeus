import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs/config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable Web Vitals tracking
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  // Sentry v11 requires its runtime injection hooks to stay unbundled, even when withSentryConfig is not applied
  serverExternalPackages: ['@sentry/server-runtime-injection'],

  // Enable standalone output for Docker
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Image configuration
  images: {
    // Next.js 16 only allows quality 75 by default; ImageMedia requests quality 100
    qualities: [75, 100],
    // Next.js 16 blocks optimizing images that resolve to local IPs; media is served from localhost in development
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      // Replaces the deprecated `domains: ['localhost']`
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/**',
      },
    ],
  },
}

// Check if Sentry should be enabled
const shouldUseSentry = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
const hasSentryConfig = process.env.SENTRY_ORG && process.env.SENTRY_PROJECT

// withPayload keeps Payload's server-only packages (drizzle-kit, esbuild, libsql, ...) out of the
// Turbopack bundle, which Next.js 16 uses by default for both dev and build
let finalConfig = withPayload(nextConfig, { devBundleServerPackages: false })

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

export default finalConfig
