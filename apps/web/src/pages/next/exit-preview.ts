import type { APIRoute } from 'astro'

import { disableDraft } from '@/lib/draft'

/** Leaves draft preview and returns to the published page. */
export const GET: APIRoute = ({ url, cookies, redirect }) => {
  disableDraft(cookies)

  const path = url.searchParams.get('path')
  return redirect(path && path.startsWith('/') && !path.startsWith('//') ? path : '/', 307)
}
