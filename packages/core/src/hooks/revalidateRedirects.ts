import type { CollectionAfterChangeHook } from 'payload'

import { revalidateFrontend } from '../utilities/revalidateFrontend'

export const revalidateRedirects: CollectionAfterChangeHook = async ({ doc, req: { payload } }) => {
  payload.logger.info(`Revalidating redirects`)

  await revalidateFrontend({ tags: ['redirects'], payload })

  return doc
}
