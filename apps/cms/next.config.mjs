import { createNextConfig } from '../../packages/core/next.config.base.mjs'

// Payload admin panel + REST/GraphQL API, served at cms.ausor.ai
export default createNextConfig(
  {
    async redirects() {
      // The website lives on its own domain; the CMS root only leads to the admin panel
      return [{ source: '/', destination: '/admin', permanent: false }]
    },
  },
  // Used for live preview URLs, SEO URLs and on-demand revalidation of the website
  { requiredEnv: ['NEXT_PUBLIC_SERVER_URL'] },
)
