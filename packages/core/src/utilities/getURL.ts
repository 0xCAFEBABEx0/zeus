const fromVercelHost = (host?: string) => (host ? `https://${host}` : undefined)

/**
 * URL of the public website (e.g. https://ausor.ai).
 * Used for page links, SEO metadata, sitemaps, live preview and on-demand revalidation.
 * The CMS must set NEXT_PUBLIC_SERVER_URL explicitly: its own Vercel production URL is the CMS domain.
 */
export const getServerSideURL = () =>
  process.env.NEXT_PUBLIC_SERVER_URL ||
  fromVercelHost(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  'http://localhost:3000'

/**
 * URL of the Payload CMS (e.g. https://cms.ausor.ai), which serves the admin panel,
 * the REST/GraphQL API and uploaded media.
 */
export const getCMSURL = () => process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3001'
