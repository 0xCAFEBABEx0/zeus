import type { Media, Page, Post } from '@zeus/core/payload-types'

import { getServerSideURL } from './env'
import { getMediaUrl } from './media'

export const SITE_NAME = 'Payload Website Template'

export type PageMeta = {
  title: string
  description: string | undefined
  ogImage: string
  url: string
}

export const defaultOgImage = (): string => `${getServerSideURL()}/website-template-OG.webp`

const ogImageURL = (image: Media | number | null | undefined): string =>
  image && typeof image === 'object'
    ? getMediaUrl(image.sizes?.og?.url || image.url) || defaultOgImage()
    : defaultOgImage()

/** Head metadata from the SEO plugin fields of a page or post. */
export const buildMeta = (doc: Partial<Page> | Partial<Post> | null, path = '/'): PageMeta => ({
  title: doc?.meta?.title ? `${doc.meta.title} | ${SITE_NAME}` : SITE_NAME,
  description: doc?.meta?.description ?? undefined,
  ogImage: ogImageURL(doc?.meta?.image),
  url: `${getServerSideURL()}${path}`,
})

/** Metadata for a route that is not a CMS document, e.g. the posts listing. */
export const staticMeta = (title: string, path: string): PageMeta => ({
  title: `${title} | ${SITE_NAME}`,
  description: undefined,
  ogImage: defaultOgImage(),
  url: `${getServerSideURL()}${path}`,
})
