import type { Post } from '@zeus/core/payload-types'

/** MM/DD/YYYY */
export const formatDateTime = (timestamp: string): string => {
  const date = timestamp ? new Date(timestamp) : new Date()
  const MM = String(date.getMonth() + 1).padStart(2, '0')
  const DD = String(date.getDate()).padStart(2, '0')
  return `${MM}/${DD}/${date.getFullYear()}`
}

/** 'A', 'A and B', 'A, B and C' */
export const formatAuthors = (
  authors: NonNullable<NonNullable<Post['populatedAuthors']>[number]>[],
): string => {
  const names = authors.map((author) => author.name).filter((name): name is string => Boolean(name))

  if (names.length === 0) return ''
  if (names.length === 1) return names[0]!
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** Category titles of a post, skipping unpopulated relations. */
export const categoryTitles = (categories: Post['categories']): string[] =>
  (categories ?? []).flatMap((category) =>
    typeof category === 'object' && category !== null ? [category.title || 'Untitled category'] : [],
  )
