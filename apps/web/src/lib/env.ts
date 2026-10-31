import { isrBypassToken } from './isr.mjs'

/**
 * Environment access for server code. Astro exposes `.env` values on `import.meta.env` in development;
 * on Vercel, runtime variables only exist on `process.env`, so fall back to it.
 * Variable names are shared with the CMS (and kept from the Next.js version of this app), hence the
 * `NEXT_PUBLIC_` prefixes.
 */
export const env = (key: string): string | undefined => {
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[key]
  return fromMeta || process.env[key] || undefined
}

const stripTrailingSlash = (value: string): string => value.replace(/\/$/, '')

/** Origin of this website (e.g. https://ausor.ai), no trailing slash. */
export const getServerSideURL = (): string => {
  const value = env('NEXT_PUBLIC_SERVER_URL')
  if (value) return stripTrailingSlash(value)
  const productionHost = env('VERCEL_PROJECT_PRODUCTION_URL')
  if (productionHost) return `https://${productionHost}`
  return 'http://localhost:3000'
}

/** Origin of the Payload CMS (admin, REST API and media), no trailing slash. */
export const getCMSURL = (): string => {
  const value = env('NEXT_PUBLIC_CMS_URL')
  if (value) return stripTrailingSlash(value)
  // A localhost fallback on Vercel looks like a working setup until every page fails with ECONNREFUSED
  if (process.env.VERCEL) throw new Error('Missing required environment variable: NEXT_PUBLIC_CMS_URL')
  return 'http://localhost:3001'
}

/** ISR bypass token for this deployment (see isr.mjs). */
export const getBypassToken = (): string | undefined => isrBypassToken(env('REVALIDATION_SECRET'))

/** Secret for a CMS deployment behind Vercel Deployment Protection (Preview), if configured. */
export const getCMSProtectionBypass = (): string | undefined => env('CMS_PROTECTION_BYPASS')
