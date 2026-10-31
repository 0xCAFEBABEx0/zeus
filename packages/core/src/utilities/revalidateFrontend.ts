import type { Payload } from 'payload'

import { getServerSideURL } from './getURL'

type Args = {
  paths?: string[]
  payload: Payload
  tags?: string[]
}

/**
 * The website (apps/web, Astro) is a separate deployment whose pages Vercel caches with ISR.
 * Ask it to re-render the changed paths; it maps the tags to the paths that show that data.
 * Failures are logged and never block saving the document.
 */
export const revalidateFrontend = async ({ paths = [], tags = [], payload }: Args) => {
  const secret = process.env.REVALIDATION_SECRET

  if (!secret) {
    payload.logger.warn('REVALIDATION_SECRET is not set; skipping website revalidation')
    return
  }

  const url = `${getServerSideURL()}/api/revalidate`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paths, tags }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      payload.logger.error(`Website revalidation failed (${res.status}) at ${url}`)
    }
  } catch (err) {
    payload.logger.error({ err }, `Website revalidation request to ${url} failed`)
  }
}
