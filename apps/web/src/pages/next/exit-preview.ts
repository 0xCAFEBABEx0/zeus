import type { APIRoute } from 'astro'

import { disableDraft } from '@/lib/draft'
import { sameOriginPath } from '@/lib/redirect'

/** Leaves draft preview and returns to the published page. */
export const GET: APIRoute = ({ url, cookies, redirect }) => {
  disableDraft(cookies)

  return redirect(sameOriginPath(url.searchParams.get('path'), url.origin) ?? '/', 307)
}
