import type { AstroCookies } from 'astro'

import type { FetchOptions } from './cms'
import { getBypassToken } from './env'

/**
 * Draft preview reuses Vercel's ISR bypass cookie: while it holds this deployment's bypass token,
 * Vercel skips the cache and renders the page for this request only. /next/preview sets it after
 * checking the editor's admin session.
 */
export const DRAFT_COOKIE = '__prerender_bypass'

/** Payload's admin session cookie. COOKIE_DOMAIN on the CMS shares it with this site in production. */
export const PAYLOAD_TOKEN_COOKIE = 'payload-token'

export const isDraft = (cookies: AstroCookies): boolean => {
  const token = getBypassToken()
  return Boolean(token) && cookies.get(DRAFT_COOKIE)?.value === token
}

/** CMS fetch options for the current request: drafts are read with the editor's own session. */
export const draftOptions = (cookies: AstroCookies): FetchOptions =>
  isDraft(cookies) ? { draft: true, authToken: cookies.get(PAYLOAD_TOKEN_COOKIE)?.value } : {}

export const enableDraft = (cookies: AstroCookies): boolean => {
  const token = getBypassToken()
  if (!token) return false
  cookies.set(DRAFT_COOKIE, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
  })
  return true
}

export const disableDraft = (cookies: AstroCookies): void => {
  cookies.delete(DRAFT_COOKIE, { path: '/', sameSite: 'none', secure: true })
}
