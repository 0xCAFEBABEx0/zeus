# Deployment

The CMS (`apps/cms`, cms.ausor.ai) and the website (`apps/web`, ausor.ai) are deployed as two Vercel projects from this repository through Vercel's Git integration. GitHub Actions only lint and type-check; they do not deploy.

## Branches and environments

| Branch | Vercel environment | Deployed | Website | CMS |
|---|---|---|---|---|
| `development` | — | No (`deploymentEnabled.development: false`) | — | — |
| `preview` | Preview | Yes | `preview.ausor.ai` | CMS project's preview URL |
| `main` | Production | Yes | `ausor.ai` | `cms.ausor.ai` |
| other branches | — | No (only `main` and `preview` are enabled) | — | — |

Changes move `development` → `preview` → `main`; see [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md).

## Vercel projects

Both projects belong to the same Vercel team and are connected to this repository.

| Setting | Website project (`zeus-web`) | CMS project (`zeus-cms`) |
|---|---|---|
| Root Directory | `apps/web` | `apps/cms` |
| Framework preset | Astro (`framework` in `vercel.json`) | Next.js |
| Include files outside the Root Directory | Enabled (default) | Enabled (default) |
| Build command | `bun run build` (from `vercel.json`) | `bun run build` (from `vercel.json`) |
| Install command | Default (Vercel detects the Bun workspace from the root `bun.lock`) | Default |
| Node.js | 26 (`NODE_VERSION` in `vercel.json`) | 26 |
| Production domains | `ausor.ai`, `www.ausor.ai` → redirect | `cms.ausor.ai` |
| Preview domain | `preview.ausor.ai` | Vercel preview URL |
| Cron | — | `GET /api/payload-jobs/run` at `0 0 * * *` (UTC) |
| Function limits | Defaults (one function for every route, Node.js 26) | `/api/*`: `maxDuration` 30 s; `/next/seed`: 60 s |

Notes:

- The website project is the original Vercel project (its domain, variables and Analytics history were kept); its Root Directory was changed to `apps/web` when the split reached `main`.
- `buildCommand` in each `vercel.json` overrides any Build Command left in the dashboard (an old `pnpm run ci` override existed).
- "Skip unaffected projects" is enabled, so a change that only touches one app builds only that project. Changes under `packages/core` or the root rebuild both.
- Preview deployments are protected by Vercel Authentication. The website reads the preview CMS with `CMS_PROTECTION_BYPASS` (the CMS project's "Protection Bypass for Automation" secret). Enabling the same feature on the website project lets `/api/revalidate` re-render its own protected Preview pages.

### DNS

Point `ausor.ai` (apex `A 76.76.21.21`) and `cms.ausor.ai` (`CNAME cname.vercel-dns.com`) at Vercel, or use the exact records Vercel shows when the domain is added.

### Environment variables

Set the variables from [CONFIGURATION.md](./CONFIGURATION.md) on both projects for each Vercel environment. Production builds stop with `Missing required environment variables: ...` when the CMS lacks `NEXT_PUBLIC_SERVER_URL` or the website lacks `NEXT_PUBLIC_CMS_URL` or `REVALIDATION_SECRET`. The website needs no database, Payload or Blob variables.

## What a build does

**CMS** (`apps/cms`): `bun run build` runs `next build` with `NODE_ENV=production`.

1. `createNextConfig()` checks `requiredEnv` (production only), wraps the config with Payload and, when `SENTRY_ORG`/`SENTRY_PROJECT` are set, with Sentry (source maps uploaded, then deleted from the output).
2. Output is `standalone` so the same build works in Docker.

**Website** (`apps/web`): `bun run build` runs `astro build`, then `scripts/set-function-runtime.mjs`.

1. `astro.config.mjs` checks `NEXT_PUBLIC_CMS_URL` and `REVALIDATION_SECRET` (production only) and derives the ISR bypass token from `REVALIDATION_SECRET`.
2. `@astrojs/vercel` writes the Build Output API layout in `.vercel/output`: static assets, one Vercel Function for every route, and the ISR configuration. No page is generated during the build and the CMS is not contacted, so a website build works while the CMS is down.
3. The Sentry integration uploads source maps when `SENTRY_AUTH_TOKEN` is set.
4. `set-function-runtime.mjs` sets the function runtime to `nodejs26.x`, because the adapter falls back to `nodejs24.x` on Node.js versions it does not know. Remove the script once the adapter supports Node.js 26.

Builds do **not** run database migrations.

### After a website deployment

ISR caches are per deployment, so a new deployment starts with an empty cache and renders each page on its first visit.

## Database changes

Because builds never migrate, a release that changes the schema needs a manual step:

1. Create the migration locally (see [DATA_MODEL.md](./DATA_MODEL.md#migrations)) and review the SQL.
2. Before merging into `preview`, apply it to the database used by Preview deployments; before merging into `main`, apply it to the production database. Use `bun run payload migrate` from `apps/cms` with `POSTGRES_URL` pointing at the target, or run the generated SQL directly.
3. Prefer additive changes (new nullable columns/tables) so the running deployment keeps working while the schema is ahead of the code.
4. Deploy, then verify the CMS and website.

## Releasing to production

1. Push the change to `development` and merge `development` into `preview` (`bun run deploy:preview` does both locally).
2. Wait for both preview deployments and check them (CI must be green).
3. Open a pull request `preview` → `main` in English and merge it.
4. Check `https://ausor.ai` and `https://cms.ausor.ai/admin` after the production deployments finish, and watch Sentry for new errors.

## Rollback

- **Code:** in each Vercel project, promote the previous production deployment ("Instant Rollback"). Then revert the change on `main` (and `preview`/`development`) so the next deployment does not bring it back.
- **Content:** restore an earlier version from the document's Versions tab in the CMS (pages and posts keep 50 versions).
- **Schema:** run the migration's `down` function or reverse the SQL by hand. Take a database backup or a Neon branch before risky migrations.

## Docker (alternative hosting)

The `Dockerfile` builds the CMS only, using Next.js standalone output. The website relies on Vercel Functions and ISR and has no standalone server; hosting it elsewhere would need a different Astro adapter (for example `@astrojs/node`) and another way to cache and revalidate pages.

```bash
docker build -t zeus-cms .   # cms.ausor.ai (APP=cms is the only accepted value)
docker run -p 3000:3000 --env-file apps/cms/.env zeus-cms
```

The image listens on port 3000 inside the container. Pass `--build-arg BUN_FROZEN_LOCKFILE=true` for reproducible installs. Provide the same environment variables as on Vercel; the Vercel cron job must be replaced by an external scheduler calling `/api/payload-jobs/run` with `CRON_SECRET`. The image's `development` target is used by the Dev Container (see [DEVELOPMENT.md](./DEVELOPMENT.md)).
