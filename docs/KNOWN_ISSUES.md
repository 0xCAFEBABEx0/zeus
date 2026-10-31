# Known issues and technical debt

Findings from reviewing the code on `main` (2026-10-25), updated for the Astro website (2026-10-31). None of them blocks the site today; they are listed so they can be planned and fixed deliberately. Remove an entry when it is fixed.

## Behaviour gaps

| # | Issue | Impact | Suggested fix |
|---|---|---|---|
| B1 | Publishing a post revalidates `/posts` (through the `posts-sitemap` tag) but not `/posts/page/*` or pages that show posts through an Archive block | Those listings refresh only when their 600-second ISR expiration runs out | Send an archive tag from `revalidatePost` and map it to the pages with Archive blocks and the post list pages in `apps/web/src/pages/api/revalidate.ts` |
| B2 | Changes to media (alt text, replaced file) and categories trigger no revalidation | Pages keep the old values until they are revalidated for another reason | Add `afterChange` hooks that revalidate the affected tags |
| B3 | Scheduled publishing runs through the daily cron at 00:00 UTC | A scheduled publish can be up to about 24 hours late | Run the jobs cron more often (Vercel plan permitting) or call the queue from another scheduler |
| B4 | No e-mail adapter is configured | Form notification e-mails and password-reset e-mails are not delivered (Payload only logs them) | Add an e-mail adapter (e.g. Resend or SMTP) to `payload.config.ts` |
| B7 | The website's middleware ignores a redirect whose reference is an unpopulated id | Such a redirect does nothing; harmless today because redirects are loaded with `depth: 1` | Look the document up by id |
| B8 | Every CMS user has full rights, including managing other users | No separation between editors and administrators | Add a `roles` field and role-based access functions if more people get access |
| B9 | No automated tests (`bun run test` is a placeholder) | Regressions are caught only by lint, type check and manual checks on Preview | Add unit tests for utilities/hooks and a Playwright smoke test of key routes |
| B10 | Redirect changes reach the website through a per-instance cache of 60 seconds plus ISR | A new redirect for a path that already has a cached page takes effect when `/api/revalidate` re-renders that path; a path that has no page yet is redirected after at most 60 seconds | Acceptable; re-render the `from` path explicitly if faster changes are needed |
| B11 | Revalidation of a Preview deployment fails while the website project is behind Vercel Authentication | Preview pages refresh only after 600 seconds | Enable "Protection Bypass for Automation" on the website project (Vercel then provides `VERCEL_AUTOMATION_BYPASS_SECRET`) |
| B12 | `@astrojs/vercel` does not know Node.js 26 and writes `nodejs24.x` | Fixed by `apps/web/scripts/set-function-runtime.mjs` after each build | Remove the script once the adapter supports Node.js 26 |
| B13 | Every uncached website render depends on the CMS | While the CMS is down, cached pages keep working, but uncached pages fail, header and footer render without navigation, sitemaps return 503 | Keep the CMS out of Deployment Protection in production and monitor it |

## Template leftovers

| # | Item | Where |
|---|---|---|
| T1 | Page titles end in `\| Payload Website Template` | `SITE_NAME` in `apps/web/src/lib/seo.ts`, `plugins/index.ts` (SEO plugin preview in the admin) |
| T2 | Default OG image `website-template-OG.webp`; the header logo is the Payload logo | `apps/web/src/lib/seo.ts`, `apps/web/src/layouts/Layout.astro`, `apps/web/src/components/Logo.astro` |
| T3 | Template welcome texts on the login screen and dashboard | `components/BeforeLogin`, `components/BeforeDashboard` |
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
