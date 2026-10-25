# Known issues and technical debt

Findings from reviewing the code on `main` (2026-10-25). None of them blocks the site today; they are listed so they can be planned and fixed deliberately. Remove an entry when it is fixed.

## Behaviour gaps

| # | Issue | Impact | Suggested fix |
|---|---|---|---|
| B1 | Publishing a post does not revalidate `/posts`, `/posts/page/*` or pages that show posts through an Archive block | New posts appear in listings only after the 10-minute ISR window; archive blocks on pages stay stale until the page itself is republished | Add `/posts` (and a tag for archive data) to `revalidatePost` |
| B2 | Changes to media (alt text, replaced file) and categories trigger no revalidation | Pages keep the old values until they are revalidated for another reason | Add `afterChange` hooks that revalidate the affected tags |
| B3 | Scheduled publishing runs through the daily cron at 00:00 UTC | A scheduled publish can be up to about 24 hours late | Run the jobs cron more often (Vercel plan permitting) or call the queue from another scheduler |
| B4 | No e-mail adapter is configured | Form notification e-mails and password-reset e-mails are not delivered (Payload only logs them) | Add an e-mail adapter (e.g. Resend or SMTP) to `payload.config.ts` |
| B5 | Sentry's browser environment uses `VERCEL_ENV`, which is not exposed to the browser | Browser events from Preview deployments are reported as `production` | Use `NEXT_PUBLIC_VERCEL_ENV` on the client |
| B6 | `/vercel-insights-test` is reachable in production | A diagnostic page is public and can be indexed | Hide it in production like `/sentry-test`, or delete it |
| B7 | In `PayloadRedirects`, a redirect whose reference is an unpopulated id is looked up by slug (`getCachedDocument(collection, id)`) | Such redirects resolve to a wrong URL; harmless today because redirects are loaded with `depth: 1` | Look the document up by id |
| B8 | Every CMS user has full rights, including managing other users | No separation between editors and administrators | Add a `roles` field and role-based access functions if more people get access |
| B9 | No automated tests (`bun run test` is a placeholder) | Regressions are caught only by lint, type check and manual checks on Preview | Add unit tests for utilities/hooks and a Playwright smoke test of key routes |

## Template leftovers

| # | Item | Where |
|---|---|---|
| T1 | Page titles end in `\| Payload Website Template`; listing titles say "Payload Website Template Posts/Search" | `utilities/generateMeta.ts`, `plugins/index.ts`, `apps/web/src/app/(frontend)/posts/page.tsx`, `search/page.tsx` |
| T2 | Default OG image `website-template-OG.webp`, Twitter creator `@payloadcms` | `utilities/generateMeta.ts`, `utilities/mergeOpenGraph.ts`, `apps/web/src/app/layout.tsx` |
| T3 | Template welcome texts on the login screen and dashboard | `components/BeforeLogin`, `components/BeforeDashboard` |
| T4 | Admin bar knows a non-existent `projects` collection | `components/AdminBar/index.tsx` |
| T5 | Root `package.json` description "Website template for Payload" | `package.json` |
| T6 | Checkly project is still the example: name `payload-vercel-website-template`, `repoUrl` of the Checkly CLI, checks against `danube-web.shop` and a books API, tag `mac` | `checkly.config.ts`, `__checks__/` |

## Unused or inconsistent code and configuration

| # | Item | Notes |
|---|---|---|
| U1 | `.github/workflows/deploy.yml` and `deployment.yml` are identical | Every push runs lint/typecheck twice. Keep one. |
| U2 | `prisma/schema.prisma` | Not used; Payload owns the schema. `.cursor/rules/project.mdc` still says "Use Prisma schema for database modeling". |
| U3 | `utilities/env.ts`: `getServerUrl()`, `getDatabaseUrl()`, `isProduction()` etc. | Unused; refer to `PAYLOAD_PUBLIC_SERVER_URL`, `DATABASE_URL` and `zeus.vercel.app`. Only `getSentryEnvironment()` is used. |
| U4 | `DATABASE_URI` in `environment.d.ts` and `docker-compose.yml` | The config reads `POSTGRES_URL`; the Dev Container must set `POSTGRES_URL` in `.env`. `environment.d.ts` also lacks `POSTGRES_URL`, `PREVIEW_SECRET` and `CRON_SECRET`. |
| U5 | `.env.example` lists many variables the apps never read | See [CONFIGURATION.md](./CONFIGURATION.md#variables-in-envexample-that-the-code-does-not-read) |
| U6 | `components/EnvironmentIndicator` | Not rendered anywhere |
| U7 | `hooks/formatSlug.ts` | Duplicate of `fields/slug/formatSlug.ts`, unused |
| U8 | `@payloadcms/db-vercel-postgres` dependency | Only imported for types by the two oldest migrations; the app uses `@payloadcms/db-postgres` |
| U9 | `payloadCloudPlugin()` | Does nothing outside Payload Cloud |
| U10 | `.cursor/rules/project.mdc` says "Create feature branches from main" | Conflicts with the `development` → `preview` → `main` workflow |
| U11 | Migration snapshots before 2026-10 did not match the production schema | Compare with the real database before applying migrations there |
| U12 | Media `staticDir` points at `packages/core/public/media` | Only used without a Blob token; files written there do not persist on Vercel |
| U13 | Sentry samples 100 % of traces in every environment | May exhaust the Sentry quota as traffic grows |
