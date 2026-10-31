import type { APIRoute } from 'astro'

import { getServerSideURL } from '@/lib/env'

export const GET: APIRoute = () =>
  new Response(
    `User-Agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${getServerSideURL()}/sitemap.xml\n`,
    { headers: { 'Content-Type': 'text/plain' } },
  )
