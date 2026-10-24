import type { GlobalAfterChangeHook } from 'payload'

import { revalidateFrontend } from '../../utilities/revalidateFrontend'

export const revalidateHeader: GlobalAfterChangeHook = async ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating header`)

    await revalidateFrontend({ tags: ['global_header'], payload })
  }

  return doc
}
