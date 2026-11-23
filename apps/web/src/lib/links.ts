import type { Page, Post } from '@zeus/core/payload-types'

export type CMSLinkData = {
  type?: 'custom' | 'reference' | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | Post | string | number
  } | null
  url?: string | null
  label?: string | null
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/**
 * Return a CMS-supplied URL only if it is relative or uses http, https, mailto or tel, so a
 * `javascript:` or `data:` URL never reaches an href or a navigation. Parsing with the URL
 * API resolves the scheme the same way the browser does (ignoring whitespace and tabs).
 */
export const safeURL = (url: string | null | undefined): string | null => {
  const trimmed = url?.trim()
  if (!trimmed) return null
  try {
    const { protocol } = new URL(trimmed, 'https://relative.invalid')
    return ALLOWED_PROTOCOLS.has(protocol) ? trimmed : null
  } catch {
    return null
  }
}

/** Resolve a CMS link field (internal reference or custom URL) to an href. */
export const linkHref = (link: CMSLinkData | null | undefined): string | null => {
  if (!link) return null
  const { type, reference, url } = link

  if (type === 'reference' && typeof reference?.value === 'object' && reference.value.slug) {
    return `${reference.relationTo !== 'pages' ? `/${reference.relationTo}` : ''}/${reference.value.slug}`
  }

  return safeURL(url)
}
