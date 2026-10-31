# Configuration

Both apps are configured only through environment variables. Locally each app reads its own `.env` (`apps/cms/.env`, `apps/web/.env`); on Vercel each project has its own variables per environment (Production, Preview, Development). `.env.example` at the repository root is the template.

Never commit real values. Secrets that both apps share (revalidation and preview secrets) must have the same value in both projects of the same environment.

## Application variables

| Variable | CMS | Web | Required | Description |
|---|---|---|---|---|
| `POSTGRES_URL` | ✓ | | Yes | PostgreSQL connection string used by Payload. The config throws at start-up when it is missing (except in CI, tests and type generation). The website has no database access. |
| `PAYLOAD_SECRET` | ✓ | | Yes | Signs Payload auth tokens. The website verifies an editor's session by calling the CMS (`/api/users/me`), so it does not need this secret. |
| `BLOB_READ_WRITE_TOKEN` | ✓ | | Yes in deployed environments | Vercel Blob token for media. Without it the storage plugin is disabled and uploads go to the local disk. |
| `NEXT_PUBLIC_SERVER_URL` | ✓ (required in production builds) | ✓ | Yes | Website origin, no trailing slash. Used for links, SEO URLs, sitemaps, preview URLs and revalidation calls. The website falls back to `VERCEL_PROJECT_PRODUCTION_URL`, the CMS must set it. |
| `NEXT_PUBLIC_CMS_URL` | ✓ | ✓ (required in production builds) | Yes | CMS origin, no trailing slash. Used by the website for the REST API, media URLs, form submissions and live preview; the website throws on Vercel when it is missing. |
| `REVALIDATION_SECRET` | ✓ | ✓ (required in production builds) | Yes | Shared bearer token for `POST /api/revalidate`. If unset on the CMS, revalidation is skipped with a warning; if unset on the website, every call gets `401`. The website also derives its ISR bypass token from it at build time, so changing it requires a redeploy of the website. |
| `PREVIEW_SECRET` | ✓ | ✓ | Yes | Shared secret embedded in preview URLs by the CMS and checked by `/next/preview`. |
| `COOKIE_DOMAIN` | ✓ | | Production only | Domain of the admin session cookie, `.ausor.ai`, so the website can read it for draft preview. Leave unset on `localhost` and `*.vercel.app`, or admin login breaks. |
| `CMS_PROTECTION_BYPASS` | | ✓ | Preview, when the CMS is protected | "Protection Bypass for Automation" secret of the CMS project. Sent as `x-vercel-protection-bypass` on every CMS request so that the website can read a CMS deployment behind Vercel Deployment Protection. Without it those requests fail with "CMS request redirected". |
| `CRON_SECRET` | ✓ | | Yes on Vercel | Bearer token Vercel Cron sends to `/api/payload-jobs/run`. |

`NEXT_PUBLIC_*` values are inlined into the CMS browser bundle at build time, so changing them requires a redeploy. The website reads its variables at runtime on the server (`env()` in `apps/web/src/lib/env.ts`), except for `REVALIDATION_SECRET`'s ISR token and the Sentry values, which are fixed at build time. The names keep the `NEXT_PUBLIC_` prefix so that both apps share them.

## Observability variables

| Variable | CMS | Web | When | Description |
|---|---|---|---|---|
| `SENTRY_DSN` | ✓ | ✓ | Runtime | DSN for server (and, on the CMS, edge) events. The website enables Sentry only when this or `NEXT_PUBLIC_SENTRY_DSN` is set at build time. |
| `NEXT_PUBLIC_SENTRY_DSN` | ✓ | ✓ | Build | DSN for browser events (the website exposes it to the browser as `PUBLIC_SENTRY_DSN`) |
| `SENTRY_ORG`, `SENTRY_PROJECT` | ✓ | ✓ | Build | CMS: enable `withSentryConfig` (source-map upload, `/monitoring` tunnel); without them the build logs a warning and skips the upload. Website: project for the source-map upload. |
| `SENTRY_AUTH_TOKEN` | ✓ | ✓ | Build | Authorises the source-map upload; the website skips the upload without it |
| `NEXT_PUBLIC_VERCEL_ENV` | ✓ | | Build | Read by the (currently unused) `EnvironmentIndicator` admin component |

Both apps report to the same Sentry project; events carry the tag `app: cms` or `app: web`. The Sentry environment is derived from `VERCEL_ENV`: `production` → `production`, `preview` → `staging`, otherwise `development`.

## Platform variables (set automatically)

| Variable | Set by | Used for |
|---|---|---|
| `VERCEL_ENV` | Vercel | `production` / `preview` / `development`; enables the production checks in `next.config.mjs` and `astro.config.mjs`, sets the Sentry environment and hides the CMS Sentry test route in production |
| `VERCEL_PROJECT_PRODUCTION_URL` | Vercel | Fallback for the website URL when `NEXT_PUBLIC_SERVER_URL` is unset |
| `VERCEL` | Vercel | Makes the website throw instead of falling back to `http://localhost:3001` when `NEXT_PUBLIC_CMS_URL` is missing |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Vercel, when "Protection Bypass for Automation" is enabled on the web project | Lets `/api/revalidate` re-render pages of a protected Preview deployment |
| `VERCEL_URL` | Vercel | Used only by the legacy `getServerUrl()` helper |
| `NODE_ENV` | Scripts / Vercel | `production` for builds (also forced in each `vercel.json`); `development` turns off database SSL |
| `CI` | GitHub Actions | Skips the `POSTGRES_URL` check and makes Sentry print upload logs |
| `NODE_VERSION` | `vercel.json` build env | Node.js major used by Vercel builds (`26`). The website's build also rewrites its function runtime to `nodejs26.x`, because `@astrojs/vercel` only knows Node.js 24 and older |
| `VERCEL_FETCH_DISABLE_H2` | Vercel project (optional, not set) | `1` makes the built-in `fetch` in Vercel Functions use HTTP/1.1; Node.js 26 negotiates HTTP/2 by default, which leaves `response.statusText` empty |

## Values per environment

| Variable | Local | Preview | Production |
|---|---|---|---|
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:3000` | `https://preview.ausor.ai` | `https://ausor.ai` |
| `NEXT_PUBLIC_CMS_URL` | `http://localhost:3001` | preview URL of the CMS project | `https://cms.ausor.ai` |
| `COOKIE_DOMAIN` | unset | unset (see note) | `.ausor.ai` |
| `POSTGRES_URL` (CMS) | local or development database | per Vercel environment setting | production database |
| `CMS_PROTECTION_BYPASS` (web) | unset | CMS project's automation bypass secret | unset |

Note: the website and CMS preview deployments only share the editor's session when both run on `*.ausor.ai` (for example `preview.ausor.ai` and `cms-preview.ausor.ai`) with `COOKIE_DOMAIN=.ausor.ai` set in the Preview environment. Preview deployments are also behind Vercel Authentication, which blocks server-to-server calls between the two preview apps: the website needs `CMS_PROTECTION_BYPASS` to read the CMS, and revalidation from the CMS to the website is rejected unless the website's protection allows it.

When upgrading an existing website deployment from the Next.js version, `POSTGRES_URL`, `PAYLOAD_SECRET` and `BLOB_READ_WRITE_TOKEN` can be removed from the web project.

## Variables in `.env.example` that the code does not read

These come from the Vercel/Neon integrations or older setups. They are harmless but are not used by the apps:

- `DATABASE_URL` (only read by the unused `getDatabaseUrl()` helper), `FORCE_USE_VERCEL_POSTGRES`
- `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `POSTGRES_URL_NO_SSL`, `POSTGRES_PRISMA_URL`, `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`
- `NEXT_PUBLIC_STACK_PROJECT_ID`, `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`, `STACK_SECRET_SERVER_KEY` (Neon Auth)
- `CHECKLY_ACCOUNT_ID`, `CHECKLY_API_KEY` (used by the Checkly CLI, not by the apps)

`DATABASE_URI`, set by `docker-compose.yml` and declared in `environment.d.ts`, is not read either; set `POSTGRES_URL` instead. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).
