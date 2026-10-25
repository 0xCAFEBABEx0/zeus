# Architecture: separate CMS and website

The repository is a Bun workspace with two Next.js apps that are deployed separately.

| App | Path | Domain | Serves |
|---|---|---|---|
| CMS | `apps/cms` | `cms.ausor.ai` | Payload admin (`/admin`), REST/GraphQL API (`/api/*`), uploaded media (`/api/media/file/*`), scheduled jobs |
| Website | `apps/web` | `ausor.ai` | Public pages, posts, search, sitemaps, draft preview (`/next/preview`), on-demand revalidation (`/api/revalidate`) |
| Shared | `packages/core` | — | Payload config, collections, globals, blocks, components, utilities, migrations, `payload-types.ts`, shared `next.config` |

```
apps/
  cms/            Next.js app: src/app/(payload)/..., vercel.json (cron)
  web/            Next.js app: src/app/(frontend)/..., public/, tailwind, sitemap
packages/
  core/src/       payload.config.ts, collections/, blocks/, components/, utilities/, migrations/
  core/next.config.base.mjs
```

Both apps import shared code through the `@/*` alias (→ `packages/core/src/*`) and the Payload config through `@payload-config`.

## How the two apps talk to each other

- **Reading content.** The website reads content with Payload's Local API (`getPayload({ config })`) straight from the same Postgres database, so it needs the same `POSTGRES_URL`, `PAYLOAD_SECRET` and `BLOB_READ_WRITE_TOKEN` as the CMS. It does not render the admin panel or expose the Payload API.
- **Cache revalidation.** Payload hooks run inside the CMS, where `revalidatePath`/`revalidateTag` would only clear the CMS's own cache. The hooks call `revalidateFrontend()` instead, which POSTs `{ paths, tags }` to `${NEXT_PUBLIC_SERVER_URL}/api/revalidate` with `Authorization: Bearer ${REVALIDATION_SECRET}`.
- **Media.** Media URLs stay relative (`/api/media/file/...`) in the database. `getMediaUrl()` prefixes them with `NEXT_PUBLIC_CMS_URL`, and the website's `next/image` config allows that host.
- **Live preview and the Preview button** point at `${NEXT_PUBLIC_SERVER_URL}/next/preview`. That route checks `PREVIEW_SECRET` and the admin session cookie, so in production the CMS sets the cookie on `COOKIE_DOMAIN=.ausor.ai` and both subdomains can read it.
- **Browser calls to the CMS** (form submissions, the admin bar's `/api/users/me`) go to `NEXT_PUBLIC_CMS_URL`; the Payload `cors` setting allows the website origin.

## Environment variables

| Variable | CMS | Web | Production value |
|---|---|---|---|
| `POSTGRES_URL`, `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN` | ✓ | ✓ | same values on both |
| `NEXT_PUBLIC_SERVER_URL` | ✓ (required) | ✓ | `https://ausor.ai` |
| `NEXT_PUBLIC_CMS_URL` | ✓ | ✓ (required) | `https://cms.ausor.ai` |
| `REVALIDATION_SECRET` | ✓ | ✓ | same random value on both |
| `PREVIEW_SECRET` | ✓ | ✓ | same random value on both |
| `COOKIE_DOMAIN` | ✓ | | `.ausor.ai` (Production only) |
| `CRON_SECRET` | ✓ | | |
| `SENTRY_*`, `NEXT_PUBLIC_SENTRY_DSN` | ✓ | ✓ | events are tagged `app: cms` / `app: web` |

Production builds fail fast when the CMS is missing `NEXT_PUBLIC_SERVER_URL` or the website is missing `NEXT_PUBLIC_CMS_URL`.

Do not set `COOKIE_DOMAIN` for deployments on `*.vercel.app` or `localhost`: the browser rejects a `.ausor.ai` cookie there and admin login stops working. Draft preview across apps on Preview deployments needs both preview apps on `*.ausor.ai` domains (for example `preview.ausor.ai` and `cms-preview.ausor.ai`) with `COOKIE_DOMAIN=.ausor.ai` in the Preview environment.

## Vercel setup

Each app needs its own Vercel project connected to the same Git repository. The existing project is kept for the website (Root Directory changed to `apps/web`, so its domain, environment variables and Analytics history stay); a new project is created for the CMS:

| | existing project (web) | new project (cms) |
|---|---|---|
| Root Directory | `apps/web` | `apps/cms` |
| Framework | Next.js | Next.js |
| Include files outside the Root Directory | enabled (default) | enabled (default) |
| Production domain | `ausor.ai` (+ `www.ausor.ai` redirect) | `cms.ausor.ai` |

Change the existing project's Root Directory only when the restructure is about to reach `main` (or while checking `preview`): until then a redeploy of `main` with the old layout would fail. The live production deployment keeps running either way.

Each app's `vercel.json` sets `buildCommand: bun run build`, which takes precedence over any Build Command override left in the project settings. The install command can stay on the default: Vercel detects the Bun workspace from the root `bun.lock` and installs all workspaces. Each app's `vercel.json` enables deployments for `main` and `preview` only; the Payload jobs cron is defined on the CMS.

DNS: point `ausor.ai` (apex `A 76.76.21.21`) and `cms.ausor.ai` (`CNAME cname.vercel-dns.com`) at Vercel, or use the exact records Vercel shows when you add each domain.

## Local development

```bash
bun install
cp .env.example apps/cms/.env && cp .env.example apps/web/.env   # then fill in values
bun run dev        # CMS on http://localhost:3001, website on http://localhost:3000
```

Cookies on `localhost` are shared across ports, so draft preview and the admin bar work locally without `COOKIE_DOMAIN`.

Payload CLI commands run in `apps/cms`: `bun run generate:types`, `bun run generate:importmap`, `bun run payload migrate`.
