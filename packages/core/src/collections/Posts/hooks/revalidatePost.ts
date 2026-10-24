import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../../../payload-types'
import { revalidateFrontend } from '../../../utilities/revalidateFrontend'

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const paths: string[] = []

    if (doc._status === 'published') {
      paths.push(`/posts/${doc.slug}`)
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      paths.push(`/posts/${previousDoc.slug}`)
    }

    if (paths.length) {
      payload.logger.info(`Revalidating post at path(s): ${paths.join(', ')}`)
      await revalidateFrontend({ paths, tags: ['posts-sitemap'], payload })
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    await revalidateFrontend({
      paths: [`/posts/${doc?.slug}`],
      tags: ['posts-sitemap'],
      payload,
    })
  }

  return doc
}
