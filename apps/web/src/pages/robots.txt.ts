import type { APIRoute } from 'astro'

import { getServerSideURL } from '@/lib/env'

export const GET: APIRoute = ({ url }) =>
  new Response(
    `User-Agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${url.origin || getServerSideURL()}/sitemap.xml\n`,
    { headers: { 'Content-Type': 'text/plain' } },
  )
