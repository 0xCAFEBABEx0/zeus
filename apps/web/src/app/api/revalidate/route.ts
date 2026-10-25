import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

/**
 * Called by the CMS (cms.ausor.ai) after content changes, because the CMS runs as a separate
 * deployment and cannot clear this app's cache itself. See `revalidateFrontend` in @zeus/core.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const secret = process.env.REVALIDATION_SECRET

  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { paths?: unknown; tags?: unknown }

  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const toStrings = (value: unknown) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

  const paths = toStrings(body.paths).filter((path) => path.startsWith('/'))
  const tags = toStrings(body.tags)

  for (const path of paths) revalidatePath(path)
  for (const tag of tags) revalidateTag(tag, { expire: 0 })

  return Response.json({ revalidated: true, paths, tags, now: Date.now() })
}
