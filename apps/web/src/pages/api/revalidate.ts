import type { APIRoute } from 'astro'

import { getAllSlugs, POSTS_PER_PAGE } from '@/lib/cms'
import { env, getBypassToken } from '@/lib/env'

/**
 * Called by the CMS after content changes (revalidateFrontend in @zeus/core):
 *
 *   POST /api/revalidate
 *   Authorization: Bearer ${REVALIDATION_SECRET}
 *   { "paths": ["/posts/foo"], "tags": ["posts-sitemap"] }
 *
 * Vercel caches the rendered pages (ISR, see astro.config.mjs). Requesting a path with the
 * `x-prerender-revalidate` header re-renders it and replaces the cached copy. Tags name data that
 * several pages use, so they are mapped to the paths that show it.
 */

/** Every cached content route: used when the header, footer or redirects change. */
const allContentPaths = async (): Promise<string[]> => {
  const [pages, posts] = await Promise.all([getAllSlugs('pages'), getAllSlugs('posts')])
  const postListPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE))

  return [
    ...pages.flatMap(({ slug }) => (slug ? [slug === 'home' ? '/' : `/${slug}`] : [])),
    ...posts.flatMap(({ slug }) => (slug ? [`/posts/${slug}`] : [])),
    '/posts',
    ...Array.from({ length: postListPages }, (_, i) => `/posts/page/${i + 1}`),
  ]
}

const pathsForTag = async (tag: string): Promise<string[]> => {
  switch (tag) {
    case 'pages-sitemap':
      return ['/pages-sitemap.xml']
    case 'posts-sitemap':
      return ['/posts-sitemap.xml', '/posts']
    case 'global_header':
    case 'global_footer':
    case 'redirects':
      return allContentPaths()
    default:
      return []
  }
}

/** Re-render a few paths at a time so that a site-wide change does not flood the function. */
const CONCURRENCY = 6

export const POST: APIRoute = async ({ request, url }) => {
  const secret = env('REVALIDATION_SECRET')
  const bypassToken = getBypassToken()

  if (!secret || !bypassToken || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { paths?: unknown; tags?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const toStrings = (value: unknown) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

  const tags = toStrings(body.tags)
  const paths = new Set(toStrings(body.paths).filter((path) => path.startsWith('/')))

  try {
    for (const tag of tags) for (const path of await pathsForTag(tag)) paths.add(path)
  } catch (error) {
    console.error('[revalidate] failed to list content paths', error)
  }

  const headers = new Headers({ 'x-prerender-revalidate': bypassToken })
  // Preview deployments are protected by Vercel Authentication, which also applies to this request
  const automationBypass = env('VERCEL_AUTOMATION_BYPASS_SECRET')
  if (automationBypass) headers.set('x-vercel-protection-bypass', automationBypass)

  const revalidated: string[] = []
  const failed: string[] = []
  const queue = [...paths]

  const worker = async () => {
    for (let path = queue.shift(); path !== undefined; path = queue.shift()) {
      try {
        const res = await fetch(new URL(path, url.origin), {
          headers,
          redirect: 'manual',
          signal: AbortSignal.timeout(15_000),
        })
        // 404s and redirects are valid results too: the document was unpublished or moved
        ;(res.status < 500 ? revalidated : failed).push(path)
      } catch {
        failed.push(path)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  if (failed.length) console.error('[revalidate] failed to re-render', failed)

  return Response.json({ revalidated, failed, tags, now: Date.now() })
}
