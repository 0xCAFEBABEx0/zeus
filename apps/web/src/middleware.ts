import { defineMiddleware } from 'astro:middleware'

import type { Redirect } from '@zeus/core/payload-types'

import { getRedirects } from '@/lib/cms'
import { getCMSURL } from '@/lib/env'
import { linkHref, type CMSLinkData } from '@/lib/links'

// Per-instance cache. Redirect responses are also cached by ISR; a change in the CMS re-renders
// every content path through /api/revalidate (tag 'redirects').
const TTL_MS = 60_000
let cache: { redirects: Redirect[]; expires: number } | null = null

const loadRedirects = async (): Promise<Redirect[]> => {
  if (cache && cache.expires > Date.now()) return cache.redirects
  const redirects = await getRedirects()
  cache = { redirects, expires: Date.now() + TTL_MS }
  return redirects
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url

  // The admin panel lives on the CMS; keep old /admin links (seed content, bookmarks) working
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return context.redirect(`${getCMSURL()}${pathname}${search}`, 307)
  }

  // Only content routes can be redirected.
  if (pathname.startsWith('/api/') || pathname.startsWith('/_') || pathname.includes('.')) {
    return next()
  }

  let redirects: Redirect[] = []
  try {
    redirects = await loadRedirects()
  } catch {
    // CMS unreachable: serve the page rather than failing the request.
    return next()
  }

  const match = redirects.find((redirect) => redirect.from === pathname)
  if (match?.to) {
    const dest =
      match.to.type === 'reference'
        ? linkHref({ type: 'reference', reference: match.to.reference } as CMSLinkData)
        : match.to.url

    if (dest) return context.redirect(dest, 307)
  }

  return next()
})
