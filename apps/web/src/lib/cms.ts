import { stringify } from 'qs-esm'

import type { Footer, Header, Page, Post, Redirect, Search } from '@zeus/core/payload-types'

import { getCMSProtectionBypass, getCMSURL } from './env'

/** Shape of Payload's paginated REST responses. */
export type PaginatedDocs<T> = {
  docs: T[]
  totalDocs: number
  totalPages: number
  page?: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage?: number | null
  prevPage?: number | null
}

export type FetchOptions = {
  /**
   * Read the newest draft instead of the published version. Payload only serves drafts to
   * signed-in users, so this needs the editor's admin session token (see lib/draft.ts);
   * without it the CMS falls back to published content.
   */
  draft?: boolean
  authToken?: string
}

export class CMSRequestError extends Error {
  readonly status: number
  readonly path: string

  constructor(message: string, { status, path }: { status: number; path: string }) {
    super(message)
    this.name = 'CMSRequestError'
    this.status = status
    this.path = path
  }
}

/**
 * Parse a CMS response as JSON. Redirects are not followed: a redirect from the CMS is almost
 * always Vercel Deployment Protection sending us to its login page, which would otherwise surface
 * as a JSON parse error.
 */
const parseResponse = async <T>(res: Response, path: string): Promise<T> => {
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location') ?? 'unknown'
    throw new CMSRequestError(
      `CMS request redirected to ${location} (${path}). If the CMS deployment is protected, set CMS_PROTECTION_BYPASS.`,
      { status: res.status, path },
    )
  }

  if (!res.ok) {
    throw new CMSRequestError(`CMS request failed with ${res.status} (${path})`, {
      status: res.status,
      path,
    })
  }

  if (!res.headers.get('content-type')?.includes('json')) {
    throw new CMSRequestError(`CMS returned a non-JSON response (${path})`, {
      status: res.status,
      path,
    })
  }

  return (await res.json()) as T
}

const cmsFetch = async <T>(
  path: string,
  query: Record<string, unknown> = {},
  { draft = false, authToken }: FetchOptions = {},
): Promise<T> => {
  // Payload's REST API expects qs-encoded nested params for `where` and `select`
  const search = stringify({ ...query, ...(draft ? { draft: 'true' } : {}) }, { addQueryPrefix: true })
  const url = `${getCMSURL()}/api${path}${search}`

  const headers = new Headers()
  const protectionBypass = getCMSProtectionBypass()
  if (protectionBypass) headers.set('x-vercel-protection-bypass', protectionBypass)
  if (draft && authToken) headers.set('Authorization', `JWT ${authToken}`)

  let res: Response
  try {
    res = await fetch(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(15_000) })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new CMSRequestError(`CMS unreachable (${path}): ${message}`, { status: 0, path })
  }

  return parseResponse<T>(res, path)
}

export const POSTS_PER_PAGE = 12

export const getPage = async (slug: string, opts: FetchOptions = {}): Promise<Page | null> => {
  const result = await cmsFetch<PaginatedDocs<Page>>(
    '/pages',
    { where: { slug: { equals: slug } }, depth: 2, limit: 1, pagination: false },
    opts,
  )
  return result.docs[0] ?? null
}

export const getPost = async (slug: string, opts: FetchOptions = {}): Promise<Post | null> => {
  const result = await cmsFetch<PaginatedDocs<Post>>(
    '/posts',
    { where: { slug: { equals: slug } }, depth: 2, limit: 1, pagination: false },
    opts,
  )
  return result.docs[0] ?? null
}

/** One page of the posts listing, newest first. */
export const getPosts = async ({ page = 1 }: { page?: number } = {}): Promise<PaginatedDocs<Post>> =>
  cmsFetch<PaginatedDocs<Post>>('/posts', {
    depth: 1,
    limit: POSTS_PER_PAGE,
    page,
    select: { title: true, slug: true, categories: true, meta: true },
  })

/** Posts for an Archive block with `populateBy: collection`, optionally filtered by category. */
export const getArchivePosts = async ({
  categoryIds,
  limit,
}: {
  categoryIds: (number | string)[]
  limit: number
}): Promise<Post[]> => {
  const result = await cmsFetch<PaginatedDocs<Post>>('/posts', {
    depth: 1,
    limit,
    ...(categoryIds.length > 0 ? { where: { categories: { in: categoryIds } } } : {}),
  })
  return result.docs
}

export const getGlobal = async <T extends Header | Footer>(slug: 'header' | 'footer'): Promise<T> =>
  cmsFetch<T>(`/globals/${slug}`, { depth: 1 })

export const searchPosts = async (query: string): Promise<PaginatedDocs<Search>> => {
  const like = query.trim()
  return cmsFetch<PaginatedDocs<Search>>('/search', {
    depth: 1,
    limit: 12,
    pagination: false,
    select: { title: true, slug: true, categories: true, meta: true },
    ...(like
      ? {
          where: {
            or: [
              { title: { like } },
              { 'meta.description': { like } },
              { 'meta.title': { like } },
              { slug: { like } },
            ],
          },
        }
      : {}),
  })
}

export const getRedirects = async (): Promise<Redirect[]> => {
  const result = await cmsFetch<PaginatedDocs<Redirect>>('/redirects', {
    depth: 1,
    limit: 0,
    pagination: false,
  })
  return result.docs
}

/** Slugs of every published page or post, for sitemaps and cache revalidation. */
export const getAllSlugs = async (
  collection: 'pages' | 'posts',
): Promise<{ slug?: string | null; updatedAt: string }[]> => {
  const result = await cmsFetch<PaginatedDocs<{ slug?: string | null; updatedAt: string }>>(
    `/${collection}`,
    {
      depth: 0,
      limit: 0,
      pagination: false,
      select: { slug: true, updatedAt: true },
      where: { _status: { equals: 'published' } },
    },
  )
  return result.docs
}

/** The signed-in CMS user for an admin session token, or null when the token is missing or invalid. */
export const getCMSUser = async (authToken: string | undefined): Promise<{ id: number | string } | null> => {
  if (!authToken) return null
  const headers = new Headers({ Authorization: `JWT ${authToken}` })
  const protectionBypass = getCMSProtectionBypass()
  if (protectionBypass) headers.set('x-vercel-protection-bypass', protectionBypass)

  try {
    const res = await fetch(`${getCMSURL()}/api/users/me`, {
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    })
    const { user } = await parseResponse<{ user: { id: number | string } | null }>(res, '/users/me')
    return user
  } catch (error) {
    console.error('[cms] failed to verify the admin session', error)
    return null
  }
}
