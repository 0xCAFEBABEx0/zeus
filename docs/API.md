# HTTP API

This document lists every HTTP endpoint the two apps expose. Payload's standard REST and GraphQL APIs are summarised; see the [Payload REST API docs](https://payloadcms.com/docs/rest-api/overview) for query parameters (`where`, `depth`, `limit`, `page`, `sort`, `select`, `draft`, `locale`).

## CMS (cms.ausor.ai, `apps/cms`)

### Admin and Payload APIs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | Redirects (temporary) to `/admin` |
| GET | `/admin/*` | Session | Payload admin panel |
| GET, POST | `/api/{collection}` | Per collection | List / create documents |
| GET, PATCH, DELETE | `/api/{collection}/{id}` | Per collection | Read / update / delete a document |
| GET, POST | `/api/globals/{header\|footer}` | Read: anyone; write: session | Read / update a global |
| POST | `/api/users/login`, `/api/users/logout`, `/api/users/refresh-token` | — / session | Authentication; sets or clears the `payload-token` cookie |
| GET | `/api/users/me` | Session or `Authorization: JWT <token>` | Current user (used by the website's `/next/preview` to verify the editor) |
| POST | `/api/users/forgot-password`, `/api/users/reset-password` | — | Password reset (needs an e-mail adapter to deliver mail) |
| GET | `/api/media/file/{filename}` | Anyone | Serves an uploaded file (streamed from Vercel Blob) |
| POST | `/api/form-submissions` | Anyone | Submit a form, see below |
| GET | `/api/payload-jobs/run` | Session or `Authorization: Bearer $CRON_SECRET` | Runs queued Payload jobs (Vercel Cron, daily 00:00 UTC) |
| POST | `/api/graphql` | Per collection | GraphQL API |
| GET | `/api/graphql-playground` | — | GraphQL playground (Payload disables it in production) |

Collection access rules are listed in [DATA_MODEL.md](./DATA_MODEL.md#access-control). Functions under `/api/*` may run for up to 30 s on Vercel (`apps/cms/vercel.json`).

CORS: browser requests are accepted from `NEXT_PUBLIC_SERVER_URL` and `NEXT_PUBLIC_CMS_URL`.

The website reads content with anonymous `GET` requests (published documents only) and, in draft preview, with `?draft=true` and the editor's `Authorization: JWT <token>`. On a protected Preview deployment it adds `x-vercel-protection-bypass: $CMS_PROTECTION_BYPASS`.

#### Form submission

```http
POST /api/form-submissions
Content-Type: application/json

{
  "form": "<form id>",
  "submissionData": [
    { "field": "email", "value": "jane@example.com" },
    { "field": "message", "value": "Hello" }
  ]
}
```

Returns `201` with the created document, or `4xx` with `{ "errors": [{ "message": "..." }] }`.

### Custom routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/next/seed` | Session | **Destructive.** Clears pages, posts, media, categories, forms, form submissions, search and the navigation globals, then loads demo content. Returns `{ "success": true }`, `403` without a session, `500` on failure. Max duration 60 s. Called by the dashboard Seed button. |
| GET | `/api/sentry-test` | — | Sends a Sentry log; `404` in production |
| POST | `/api/sentry-test` | — | Throws and captures a test error; returns `500` by design; `404` in production |

## Website (ausor.ai, `apps/web`)

### Pages

| Path | Description |
|---|---|
| `/` | Home page (page with slug `home`) |
| `/{slug}` | Published page |
| `/posts` | Post listing, page 1 |
| `/posts/page/{n}` | Post listing, page *n* |
| `/posts/{slug}` | Post |
| `/search?q={query}` | Search results |
| `/admin`, `/admin/*` | Temporary redirect (307) to the same path on the CMS |

Pages are rendered by a Vercel Function and cached by ISR, except `/search`. Draft-mode responses carry `Cache-Control: private, no-store`. Unknown paths return the 404 page; a CMS error returns the 500 page, which does not call the CMS.

### SEO files

| Path | Source |
|---|---|
| `/sitemap.xml` | Sitemap index pointing at the two sitemaps below |
| `/robots.txt` | Allows everything except `/admin/` and `/api/`; points at `/sitemap.xml` |
| `/pages-sitemap.xml` | Published pages plus `/search` and `/posts`; re-rendered for tag `pages-sitemap`; `503` while the CMS is unreachable |
| `/posts-sitemap.xml` | Published posts; re-rendered for tag `posts-sitemap`; `503` while the CMS is unreachable |

All URLs use `NEXT_PUBLIC_SERVER_URL` as the origin.

### `POST /api/revalidate`

Called by the CMS (`revalidateFrontend()` in `packages/core/src/utilities/revalidateFrontend.ts`) after content changes.

```http
POST /api/revalidate
Authorization: Bearer <REVALIDATION_SECRET>
Content-Type: application/json

{ "paths": ["/posts/hello-world"], "tags": ["posts-sitemap"] }
```

| Status | Body | When |
|---|---|---|
| 200 | `{ "revalidated": [...], "failed": [...], "tags": [...], "now": 1730000000000 }` | Processed. `revalidated` lists the paths that were re-rendered (a `404` or redirect counts, since the document may be gone); `failed` lists paths that returned `5xx` or timed out. Only string paths starting with `/` and string tags are applied; others are dropped silently. |
| 400 | `{ "error": "Invalid JSON body" }` | Body is not JSON |
| 401 | `{ "error": "Unauthorized" }` | Missing or wrong token, or `REVALIDATION_SECRET` unset on the website |

Each tag adds paths:

| Tag | Paths |
|---|---|
| `pages-sitemap` | `/pages-sitemap.xml` |
| `posts-sitemap` | `/posts-sitemap.xml`, `/posts` |
| `global_header`, `global_footer`, `redirects` | Every published page and post, `/posts` and `/posts/page/{n}` |
| other | none |

Each path is then requested from the same deployment with `x-prerender-revalidate: <ISR bypass token>` (six at a time, 15 s timeout each), which makes Vercel re-render it and replace the cached copy.

### `GET /next/preview`

Entered from the CMS Preview button and live preview (URLs are built by `generatePreviewPath()`).

| Query parameter | Description |
|---|---|
| `path` | Relative path to open, e.g. `/posts/hello-world` |
| `collection` | `pages` or `posts` |
| `slug` | Document slug |
| `previewSecret` | Must equal `PREVIEW_SECRET` |

Responses: `403` for a wrong secret or no signed-in user (the `payload-token` cookie must be readable on the website and accepted by the CMS's `/api/users/me`), `404` when a parameter is missing, `500` for a non-relative path or when `REVALIDATION_SECRET` is unset; otherwise the `__prerender_bypass` cookie (HTTP-only, `SameSite=None; Secure`, so that it also works inside the live preview iframe) is set and the request is redirected (307) to `path`.

### `GET /next/exit-preview`

Clears the draft cookie and redirects (307) to the relative `path` query parameter, or to `/`.

## Sentry tunnel (CMS)

When `SENTRY_ORG` and `SENTRY_PROJECT` are set at build time, `withSentryConfig` adds a `/monitoring` route to the CMS that forwards browser events to Sentry so ad blockers do not drop them. The website sends browser events to Sentry directly.
