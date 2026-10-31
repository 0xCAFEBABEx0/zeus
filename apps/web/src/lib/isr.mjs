import { createHash } from 'node:crypto'

/**
 * Token that makes Vercel bypass the ISR cache: sent as the `x-prerender-revalidate` header to
 * re-render a path, and stored in the `__prerender_bypass` cookie during draft preview.
 * Derived from REVALIDATION_SECRET so that the secret itself never reaches a browser and the
 * token always meets Vercel's 32-character minimum. Shared by astro.config.mjs and the runtime.
 *
 * @param {string | undefined} secret REVALIDATION_SECRET
 * @returns {string | undefined}
 */
export const isrBypassToken = (secret) =>
  secret ? createHash('sha256').update(`zeus-isr-bypass:${secret}`).digest('hex') : undefined
