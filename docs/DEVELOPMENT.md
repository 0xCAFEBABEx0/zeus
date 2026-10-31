# Development guide

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 26.13.0 | `.nvmrc`; `engines` allows `>=26.13.0 <27` |
| Bun | 1.4.4 | `packageManager` in `package.json`; used for installs and scripts |
| PostgreSQL | 16 recommended | Local server, Docker, or a hosted development database |
| Git | any recent | |

Optional: Docker for the Dev Container, the Vercel CLI for pulling environment variables (`vercel env pull`).

## First-time setup

```bash
git clone https://github.com/0xCAFEBABEx0/zeus.git
cd zeus
bun install

# Each app reads its own .env
cp .env.example apps/cms/.env
cp .env.example apps/web/.env
# or keep one root .env and symlink it:
#   ln -s ../../.env apps/cms/.env && ln -s ../../.env apps/web/.env
```

Fill in at least `POSTGRES_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL=http://localhost:3000`, `NEXT_PUBLIC_CMS_URL=http://localhost:3001`, `REVALIDATION_SECRET` and `PREVIEW_SECRET`. Leave `COOKIE_DOMAIN` and `CMS_PROTECTION_BYPASS` empty. The website only uses the URLs and the two shared secrets; the database and Payload variables are for the CMS. See [CONFIGURATION.md](./CONFIGURATION.md).

Without `BLOB_READ_WRITE_TOKEN`, uploads are stored on disk under `packages/core/public/media`.

### Database

A fresh database needs the schema. Either run the migrations:

```bash
cd apps/cms && bun run payload migrate
```

or let Payload push the schema automatically: in development (`NODE_ENV` not `production`) the Postgres adapter syncs the schema from the config on start-up and prompts before destructive changes. Do not point a development server at the production database.

### Dev Container

`.devcontainer/devcontainer.json` starts `docker-compose.yml`: an `app` container built from the `development` target of the `Dockerfile` (Node 26.13.0 + Bun, user `vscode`) and a `postgres:16` container with database `payload_db` and trust authentication.

The `postgres` service loads a repository-root `.env` (`env_file: .env`), so Compose refuses to start without it. Before opening the Dev Container, use the root-`.env` variant of the setup above:

```bash
cp .env.example .env
ln -s ../../.env apps/cms/.env && ln -s ../../.env apps/web/.env
```

and set the database URL in it to the Compose service:

```
POSTGRES_URL=postgres://postgres@postgres:5432/payload_db
```

Ports 3000 and 3001 are forwarded.

## Running the apps

```bash
bun run dev        # both apps
bun run dev:web    # website only (Astro), http://localhost:3000; needs the CMS running
bun run dev:cms    # CMS only, http://localhost:3001
```

| URL | What |
|---|---|
| http://localhost:3000 | Website |
| http://localhost:3001/admin | CMS admin (create the first user on first visit) |
| http://localhost:3001/api/graphql-playground | GraphQL playground |

Cookies on `localhost` are shared across ports, so draft preview works locally without `COOKIE_DOMAIN`. There is no ISR cache in `astro dev`: every request renders with the latest published content, so revalidation has no visible effect locally.

### Demo content

Sign in to the CMS and click **Seed your database** on the dashboard. This deletes existing content (see [API.md](./API.md#custom-routes)), so use it only on a local or empty database. Revalidation errors in the log while seeding are expected when the website is not running.

## Scripts

Run from the repository root.

| Script | What it does |
|---|---|
| `bun run dev`, `dev:cms`, `dev:web` | Start the dev servers (Next.js with Turbopack for the CMS, `astro dev` for the website) |
| `bun run build`, `build:cms`, `build:web` | Production builds (`build` builds both) |
| `bun run lint`, `lint:fix` | ESLint for the whole repository |
| `bun run typecheck` | `tsc --noEmit` in the CMS (includes `packages/core`) and `astro check` in the website |
| `bun run generate:types` | Regenerate `packages/core/src/payload-types.ts` |
| `bun run generate:importmap` | Regenerate the admin import map in `apps/cms` |
| `bun run payload <command>` | Payload CLI in `apps/cms`, e.g. `migrate`, `migrate:status`, `migrate:create` |
| `bun run ii` | `bun install --frozen-lockfile` |
| `bun run reinstall` | Delete all `node_modules` and `bun.lock`, then reinstall (changes the lockfile) |
| `bun run deploy:preview` | Merge `development` into `preview` locally and push |
| `bun run deploy:production` | Merge `preview` into `main` and push. Do not use it: production changes go through a pull request |
| `bun run env:check` | Print `NODE_ENV` and `VERCEL_ENV` |
| `bun run test` | Placeholder; there are no automated tests yet |

## Everyday tasks

### After changing the content model

```bash
bun run generate:types        # always
bun run generate:importmap    # when admin components were added or moved
cd apps/cms && BLOB_READ_WRITE_TOKEN=dummy bun run payload migrate:create <name>
```

Commit `payload-types.ts`, the import map and the migration together with the change. See [DATA_MODEL.md](./DATA_MODEL.md#migrations).

### Before pushing

```bash
bun run lint
bun run generate:types
bun run typecheck
```

This is what CI runs. Run `bun run build` too when you touched `next.config`, `astro.config.mjs` or the routes.

## Coding conventions

- TypeScript everywhere, strict mode with `noUncheckedIndexedAccess` (`tsconfig.base.json`).
- Prettier: single quotes, no semicolons, trailing commas, 100-character lines (`.prettierrc.json`). EditorConfig: 2-space indentation, LF.
- ESLint: `eslint-config-next` (core web vitals + TypeScript) for the TypeScript files; `.astro` files are checked by `astro check`, not ESLint. Unused variables are allowed only with a leading `_`.
- In the CMS and `packages/core`, import shared code with `@/…` and the Payload config with `@payload-config`. In the website, `@/…` means `apps/web/src/…` and `@zeus/core/…` reaches `packages/core/src/…`; import only types and plain data from it, never Payload or React code. Do not import between `apps/cms` and `apps/web`.
- Build absolute URLs with `getServerSideURL()` / `getCMSURL()` and media URLs with `getMediaUrl()`; never hard-code domains. On the website, read environment variables with `env()` from `src/lib/env.ts` and content only through the functions in `src/lib/cms.ts`.
- From CMS-side code, invalidate website caches with `revalidateFrontend()`, never with `revalidatePath`/`revalidateTag` directly.
- Components: PascalCase directories with `index.tsx` in `packages/core` (admin components); PascalCase `.astro` files in `apps/web/src/components`; utilities: camelCase files.
- Keep comments short and explain why, not what.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `CRITICAL: POSTGRES_URL environment variable is not set.` | The app's own `.env` is missing or lacks `POSTGRES_URL` |
| Admin login works but preview returns 403 | The website did not receive the `payload-token` cookie or the CMS rejected it; in deployed environments `COOKIE_DOMAIN` must cover both domains |
| Preview returns 403 "You are not allowed" right away | `PREVIEW_SECRET` differs between the apps |
| Edits do not show up on the website | Check the CMS log for `Website revalidation failed`; `REVALIDATION_SECRET` must match and `NEXT_PUBLIC_SERVER_URL` must reach the website |
| Website pages fail with `CMS unreachable` or `CMS request failed` | Start the CMS and check `NEXT_PUBLIC_CMS_URL` in `apps/web/.env` |
| `CMS request redirected to https://vercel.com/...` on a Preview deployment | The CMS preview is behind Deployment Protection; set `CMS_PROTECTION_BYPASS` on the web project |
| `CMS request redirected to` another host | `NEXT_PUBLIC_CMS_URL` is not the CMS's own origin (for example a domain that Vercel redirects); set it to the origin in the message |
| Images fail to load | `NEXT_PUBLIC_CMS_URL` must match the CMS origin that serves `/api/media/file/*` |
| Admin shows "component not found" | `bun run generate:importmap` |
| Type errors after a model change | `bun run generate:types` |
| Port already in use | `lsof -ti:3000 \| xargs kill` (or 3001) |
| Odd behaviour after dependency changes | Delete `apps/cms/.next`, `apps/web/.astro` and `apps/web/dist`, then restart; as a last resort `bun run reinstall` |
