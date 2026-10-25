import { createNextConfig } from '../../packages/core/next.config.base.mjs'

// Media is uploaded to and served by the CMS (cms.ausor.ai/api/media/file/...)
const cmsURL = new URL(process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3001')

// Public website, served at ausor.ai
export default createNextConfig(
  {
    async redirects() {
      // The admin panel moved to the CMS; keep existing /admin links (seed content, bookmarks) working
      return [
        {
          source: '/admin/:path*',
          destination: `${cmsURL.origin}/admin/:path*`,
          permanent: false,
        },
      ]
    },
    images: {
      // Next.js 16 only allows quality 75 by default; ImageMedia requests quality 100
      qualities: [75, 100],
      // Next.js 16 blocks optimizing images that resolve to local IPs; media is served from localhost in development
      dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
      remotePatterns: [
        {
          protocol: /** @type {'http' | 'https'} */ (cmsURL.protocol.replace(':', '')),
          hostname: cmsURL.hostname,
          port: cmsURL.port,
          pathname: '/api/media/**',
        },
        // Replaces the deprecated `domains: ['localhost']`
        { protocol: 'http', hostname: 'localhost' },
        { protocol: 'https', hostname: 'localhost' },
      ],
    },
  },
  { requiredEnv: ['NEXT_PUBLIC_CMS_URL'] },
)
