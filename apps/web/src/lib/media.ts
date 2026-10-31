import type { Media } from '@zeus/core/payload-types'

import { getCMSURL } from './env'

/** Absolute URL for a media file: relative paths (/api/media/file/...) are served by the CMS. */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''
  const absolute = url.startsWith('http://') || url.startsWith('https://') ? url : `${getCMSURL()}${url}`
  return cacheTag ? `${absolute}?${encodeURIComponent(cacheTag)}` : absolute
}

/** Videos are uploaded to the same collection; they render as <video> instead of <img>. */
export const isVideo = (resource: Media): boolean => Boolean(resource.mimeType?.startsWith('video/'))

export type ImgAttrs = {
  src: string
  srcset: string | undefined
  width: number | undefined
  height: number | undefined
  alt: string
}

/** <img> attributes for a media document, with a srcset built from its generated sizes. */
export const imgAttrs = (resource: Media): ImgAttrs => {
  const srcset =
    Object.values(resource.sizes ?? {})
      .filter((size) => size?.url && size.width)
      .map((size) => `${getMediaUrl(size?.url, resource.updatedAt)} ${size?.width}w`)
      .join(', ') || undefined

  return {
    src: getMediaUrl(resource.url, resource.updatedAt),
    srcset,
    width: resource.width ?? undefined,
    height: resource.height ?? undefined,
    alt: resource.alt || '',
  }
}
