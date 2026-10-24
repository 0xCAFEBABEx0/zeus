import type { GlobalAfterChangeHook } from 'payload'

import { revalidateFrontend } from '../../utilities/revalidateFrontend'

export const revalidateFooter: GlobalAfterChangeHook = async ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating footer`)

    await revalidateFrontend({ tags: ['global_footer'], payload })
  }

  return doc
}
