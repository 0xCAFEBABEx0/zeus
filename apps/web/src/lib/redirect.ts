const UNSAFE_PATH_CHARS = /[\\\u0000-\u001f\u007f]/

/**
 * Returns `path` as a same-origin `pathname + search` for a redirect, or null when it is not a
 * relative path on `origin`. Backslashes and control characters are rejected because browsers
 * normalize `/\evil.com` to `//evil.com` and strip tabs and newlines.
 */
export const sameOriginPath = (path: string | null | undefined, origin: string): string | null => {
  if (!path || !path.startsWith('/') || path.startsWith('//') || UNSAFE_PATH_CHARS.test(path)) {
    return null
  }

  let resolved: URL
  try {
    resolved = new URL(path, origin)
  } catch {
    return null
  }

  if (resolved.origin !== new URL(origin).origin || resolved.pathname.startsWith('//')) return null

  return resolved.pathname + resolved.search
}
