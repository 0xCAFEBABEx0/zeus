import type { APIRoute } from 'astro'

import { getCMSUser } from '@/lib/cms'
import { disableDraft, enableDraft, PAYLOAD_TOKEN_COOKIE } from '@/lib/draft'
import { env } from '@/lib/env'

/**
 * Entry point of draft preview and live preview. The CMS links here from its Preview button
 * (generatePreviewPath in @zeus/core):
 *
 *   /next/preview?slug=...&collection=...&path=/posts/foo&previewSecret=...
 *
 * The editor must be signed in to the CMS. In production the admin session cookie is shared with
 * this site through COOKIE_DOMAIN=.ausor.ai.
 */
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const path = url.searchParams.get('path')
  const collection = url.searchParams.get('collection')
  const slug = url.searchParams.get('slug')
  const previewSecret = url.searchParams.get('previewSecret')

  if (!previewSecret || previewSecret !== env('PREVIEW_SECRET')) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  if (!path || !collection || !slug) {
    return new Response('Insufficient search params', { status: 404 })
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    return new Response('This endpoint can only be used for relative previews', { status: 500 })
  }

  const user = await getCMSUser(cookies.get(PAYLOAD_TOKEN_COOKIE)?.value)

  if (!user) {
    disableDraft(cookies)
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  if (!enableDraft(cookies)) {
    return new Response('Draft preview needs REVALIDATION_SECRET on the website', { status: 500 })
  }

  return redirect(path, 307)
}
