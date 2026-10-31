# Operations

How Zeus is monitored and what to do when something goes wrong.

## Monitoring

### Sentry

The CMS uses `@sentry/nextjs` and the website `@sentry/astro`; both report to the same Sentry project.

| App | File | Runtime | DSN variable |
|---|---|---|---|
| CMS | `src/instrumentation-client.ts` | Browser | `NEXT_PUBLIC_SENTRY_DSN` |
| CMS | `sentry.server.config.ts` (loaded from `src/instrumentation.ts`) | Node.js | `SENTRY_DSN` |
| CMS | `sentry.edge.config.ts` | Edge | `SENTRY_DSN` |
| Website | `sentry.client.config.ts` | Browser | `NEXT_PUBLIC_SENTRY_DSN` (inlined at build time) |
| Website | `sentry.server.config.ts` | Node.js | `SENTRY_DSN` |

- Every event is tagged `app: cms` or `app: web`; filter on that tag in Sentry.
- Environments: `production` (Vercel Production), `staging` (Vercel Preview), `development` (local).
- `tracesSampleRate` is 1.0 (all transactions). Browser Session Replay records 10 % of sessions and 100 % of sessions with an error. Console output (`log`, `warn`, `error`, and on the server also `info`, `debug`) is forwarded as Sentry logs. Lower these rates if the Sentry quota becomes a problem.
- CMS: `onRequestError` forwards server request errors; `onRouterTransitionStart` traces client navigations. Browser events go through the `/monitoring` tunnel route to avoid ad blockers.
- Website: the Sentry integration wraps every request; it is enabled only when a DSN is set at build time.
- Source maps are uploaded at build time when `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` are set.

To check the setup on Preview or locally, call `GET`/`POST /api/sentry-test` on the CMS (404 in production). The website has no test page; a request that fails while the CMS is stopped locally produces a server event.

### Vercel Analytics and Speed Insights

The Vercel adapter injects Web Analytics (`webAnalytics` in `astro.config.mjs`) and the layout renders `<SpeedInsights />`. Data appears in the website's Vercel project. The CMS does not collect analytics.

### Vercel logs

Runtime logs for each app are in its Vercel project. Useful CMS log lines:

| Message | Meaning |
|---|---|
| `Revalidating page at path(s): …` / `Revalidating post …` / `Revalidating header` | A publish triggered website revalidation |
| `Website revalidation failed (<status>) at …` | The website answered with an error (401 → secrets differ) |
| `Website revalidation request to … failed` | The website was unreachable or took longer than 10 s |
| `REVALIDATION_SECRET is not set; skipping website revalidation` | The CMS lacks the secret |

Useful website log lines:

| Message | Meaning |
|---|---|
| `CMS request redirected to … If the CMS deployment is protected, set CMS_PROTECTION_BYPASS.` | The CMS is behind Deployment Protection |
| `CMS unreachable (…)` / `CMS request failed with <status> (…)` | The CMS is down or returned an error |
| `[revalidate] failed to re-render [...]` | Some paths could not be re-rendered; they refresh within 600 s |
| `[cms] failed to verify the admin session` | `/next/preview` could not reach `/api/users/me` |

### Checkly

`checkly.config.ts` and `__checks__/` define synthetic checks (every 10 minutes from us-east-1 and eu-west-1) run by the Checkly CLI with `CHECKLY_ACCOUNT_ID` / `CHECKLY_API_KEY`. Only `custom.spec.ts` targets this site (`https://ausor.ai/` must return < 400); the other checks are Checkly examples. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).

## Scheduled jobs

| Job | Schedule | Endpoint | Auth |
|---|---|---|---|
| Payload job queue | Daily, 00:00 UTC (`apps/cms/vercel.json`) | `GET /api/payload-jobs/run` on the CMS | `Authorization: Bearer $CRON_SECRET` (sent by Vercel Cron) |

Scheduled publishing of pages and posts is processed by this job queue, so a scheduled publish takes effect at the next run (at most about a day late). Trigger the queue by hand by opening `/api/payload-jobs/run` while signed in to the CMS, or:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://cms.ausor.ai/api/payload-jobs/run
```

## Runbooks

### The website shows stale content after publishing

1. Check the CMS logs for revalidation errors (table above).
2. Confirm `REVALIDATION_SECRET` is identical in both projects and `NEXT_PUBLIC_SERVER_URL` on the CMS points at the website.
3. Archive blocks and `/posts/page/N` refresh within 10 minutes; media and category edits alone do not trigger revalidation. Re-publishing the affected page or post forces it, and saving the header or footer re-renders every page.
4. As a last resort, redeploy the website project (a new deployment starts with an empty cache).

### Editors cannot preview drafts

1. Production: `COOKIE_DOMAIN=.ausor.ai` must be set on the CMS project; editors must sign in again after it changes.
2. `PREVIEW_SECRET` must be identical in both projects, and the website needs `REVALIDATION_SECRET` (the draft cookie is derived from it).
3. Preview deployments on `*.vercel.app` cannot share the cookie; see [CONFIGURATION.md](./CONFIGURATION.md#values-per-environment).

### Admin login fails on a Vercel preview URL

`COOKIE_DOMAIN` is set for that environment. Remove it from the Preview environment (or move both preview apps onto `*.ausor.ai` domains).

### Images are broken on the website

1. Open the image URL on `cms.ausor.ai/api/media/file/...` directly. If it fails, check the CMS deployment and `BLOB_READ_WRITE_TOKEN`.
2. If it works, check that the website's `NEXT_PUBLIC_CMS_URL` matches the CMS origin, then re-render the page (republish it) because the cached HTML contains the image URLs.

### A deployment fails to build

1. `Missing required environment variables` → set the variable in that Vercel project and environment.
2. The website build never contacts the CMS or the database. If the website deploys but every page fails, check `NEXT_PUBLIC_CMS_URL`, `CMS_PROTECTION_BYPASS` and the CMS deployment.
3. Type or lint errors → reproduce locally with `bun run lint && bun run generate:types && bun run typecheck && bun run build`.

### Production incident

1. Roll back in Vercel (Instant Rollback on the affected project), see [DEPLOYMENT.md](./DEPLOYMENT.md#rollback).
2. Find the cause in Sentry (filter by `app` tag and release) and the Vercel logs.
3. Fix through a hotfix branch ([DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md#hotfixes)).

## Routine maintenance

- Keep Node.js on the active LTS line pinned in `.nvmrc`, `engines`, the `Dockerfile`, CI and `vercel.json`, and update them together.
- Upgrade Payload packages together (all `@payloadcms/*` share one version) and check for schema changes with `migrate:create` after each upgrade.
- Review Sentry quotas and sampling rates periodically.
- Rotate `PAYLOAD_SECRET` (CMS only; signs out every editor), `REVALIDATION_SECRET`, `PREVIEW_SECRET` and `CRON_SECRET` in both projects at the same time, then redeploy the website (its ISR token is derived from `REVALIDATION_SECRET` at build time).
