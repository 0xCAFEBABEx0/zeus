import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Page } from '../../../payload-types'
import { revalidateFrontend } from '../../../utilities/revalidateFrontend'

const pathFor = (slug?: string | null) => (slug === 'home' ? '/' : `/${slug}`)

export const revalidatePage: CollectionAfterChangeHook<Page> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const paths: string[] = []

    if (doc._status === 'published') {
      paths.push(pathFor(doc.slug))
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      paths.push(pathFor(previousDoc.slug))
    }

    if (paths.length) {
      payload.logger.info(`Revalidating page at path(s): ${paths.join(', ')}`)
      await revalidateFrontend({ paths, tags: ['pages-sitemap'], payload })
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    await revalidateFrontend({ paths: [pathFor(doc?.slug)], tags: ['pages-sitemap'], payload })
  }

  return doc
}
