# Specification

This document describes what Zeus does today. It is derived from the code on `main`; where behaviour comes from a Payload plugin, the plugin is named so you can look up its details.

## Purpose and scope

Zeus publishes a content-driven website (pages and blog posts) at **ausor.ai** and lets editors manage that content in a CMS at **cms.ausor.ai**. It started from the official Payload "website" template and keeps most of its features.

In scope:

- Public website: pages built from blocks, a blog, search, forms, SEO metadata, sitemaps, redirects.
- CMS: content editing with drafts, autosave, live preview and scheduled publishing; media library; navigation; form builder; redirects; user accounts.
- Operations: error tracking, analytics, scheduled jobs, separate preview and production environments.

Out of scope (not implemented): public user accounts or sign-up, comments, e-commerce or payments (the form builder's payment field is disabled), localisation (the site is English only), role-based permissions inside the CMS.

## Actors

| Actor | Description | How they are identified |
|---|---|---|
| Visitor | Anyone browsing ausor.ai | Anonymous |
| Editor | A person who signs in to the CMS. Every signed-in user has full access to all content and to other user accounts; there are no roles. | A document in the `users` collection; session cookie `payload-token` |
| CMS app | Calls the website after content changes so cached pages are refreshed | `REVALIDATION_SECRET` bearer token |
| Vercel Cron | Runs the Payload job queue once a day | `CRON_SECRET` bearer token |

## Functional requirements: website (ausor.ai)

### Pages

- **WEB-1** The home page `/` renders the page whose slug is `home`. If no such page exists (an unseeded database), a built-in static home page is shown instead.
- **WEB-2** Any other published page is served at `/{slug}`. A page consists of a hero (none, low, medium or high impact) followed by a list of layout blocks: Call to Action, Content (columns), Media, Archive (post list) and Form.
- **WEB-3** Pages that are not published are not visible to visitors. Unknown URLs fall through to redirects (WEB-9) and then to a 404 page.

### Blog

- **WEB-4** `/posts` lists published posts, 12 per page, with a "showing x–y of z" range and pagination. Further pages are at `/posts/page/{n}`; a non-numeric `n` returns 404.
- **WEB-5** `/posts/{slug}` shows a post: hero (hero image, title, categories, authors, publish date), rich-text body (headings, banners, code blocks, media, horizontal rules) and up to the selected related posts.
- **WEB-6** Post authors are shown by name only. User e-mail addresses are never exposed (see `populatedAuthors` in [DATA_MODEL.md](./DATA_MODEL.md)).

### Search

- **WEB-7** `/search?q={query}` searches published posts. A post matches when its title, SEO title, SEO description or slug contains the query (case-insensitive `like`). At most 12 results are shown, without pagination; without a query the first 12 index entries are listed. Pages are not searchable.

### Navigation, forms and redirects

- **WEB-8** Every page shows a header and a footer. Each holds up to six links, managed in the CMS, pointing either at a page/post or at a custom URL, optionally opening in a new tab.
- **WEB-9** Redirects managed in the CMS are applied on the server: when a URL matches a redirect's `from` value the visitor is sent to its target (a page, a post or a custom URL). Redirects are checked both for unknown URLs and for existing pages.
- **WEB-10** A Form block renders a form built in the CMS (text, textarea, e-mail, number, select, checkbox, country, state and message fields). Submissions are posted from the browser to the CMS (`POST /api/form-submissions`). After a successful submission the form shows its confirmation message or redirects to its configured URL. E-mail notifications configured on a form are sent by Payload (an e-mail adapter must be configured for them to be delivered).
- **WEB-11** `/admin` and `/admin/*` on the website redirect (temporarily) to the same path on the CMS.

### SEO

- **WEB-12** Each page and post has a `<title>` of the form `{SEO title} | Payload Website Template`, a meta description and Open Graph tags. The OG image is the SEO image's `og` size (1200×630), falling back to `/website-template-OG.webp`.
- **WEB-13** The site publishes `/sitemap.xml` and `/robots.txt` (generated at build time by `next-sitemap`), plus dynamic `/pages-sitemap.xml` and `/posts-sitemap.xml`. `robots.txt` disallows `/admin/*`.

### Presentation

- **WEB-14** The site supports light and dark themes with a theme selector; the initial theme follows the stored preference or the operating system.
- **WEB-15** Images are served through `next/image` from the CMS media URLs, in responsive sizes.

### Editor features on the website

- **WEB-16** When an editor who is signed in to the CMS visits the website, an admin bar is shown with links to edit the current document and to exit preview. (In production this needs the shared cookie domain, see [CONFIGURATION.md](./CONFIGURATION.md).)
- **WEB-17** Draft preview: the CMS "Preview" button and live preview open the website in Next.js draft mode, which shows the latest draft instead of the published version. Only signed-in editors who also present the preview secret can enter draft mode. With live preview, the page refreshes automatically as the editor types (autosave).

### Diagnostic pages

- **WEB-18** `/sentry-test` (website) and `/api/sentry-test` (CMS) trigger test errors, spans and logs for Sentry. They return 404 in the production environment.
- **WEB-19** `/vercel-insights-test` shows whether Vercel Analytics and Speed Insights are loaded. It is available in every environment.

## Functional requirements: CMS (cms.ausor.ai)

- **CMS-1** The admin panel is served at `/admin`; `/` redirects there. Only users in the `users` collection can sign in.
- **CMS-2** Editors can create, edit and delete pages, posts, media, categories, header and footer navigation, redirects, forms and users, and read (and delete) form submissions and search index entries.
- **CMS-3** Pages and posts are versioned: drafts, autosave every 100 ms while editing (to drive live preview), up to 50 versions kept per document, and publishing at a scheduled date and time.
- **CMS-4** Live preview offers Mobile (375×667), Tablet (768×1024) and Desktop (1440×900) breakpoints.
- **CMS-5** Slugs are generated from the title and can be unlocked and edited by hand. `publishedAt` is filled in automatically when a document is published without one.
- **CMS-6** The SEO tab of pages and posts can auto-generate the meta title and the canonical URL, and shows a search-result preview.
- **CMS-7** Uploaded images get seven derived sizes (thumbnail, square, small, medium, large, xlarge, og) and support a focal point. Files are stored in Vercel Blob.
- **CMS-8** Categories can be nested; each category stores its breadcrumb trail.
- **CMS-9** Publishing a post updates the search index automatically.
- **CMS-10** Changing published content refreshes the website's cache within seconds (on-demand revalidation, see [DESIGN.md](./DESIGN.md#rendering-and-caching)).
- **CMS-11** The dashboard has a "Seed" button that **deletes** all pages, posts, media, categories, forms, form submissions and search entries and replaces them with demo content. It is meant for empty or local databases only.
- **CMS-12** The Payload job queue (used by scheduled publishing) runs once a day at 00:00 UTC via Vercel Cron. Signed-in users can also trigger it.
- **CMS-13** A REST API (`/api/*`) and a GraphQL API (`/api/graphql`, playground at `/api/graphql-playground`) expose all collections, subject to the access rules in [DATA_MODEL.md](./DATA_MODEL.md#access-control).

## Non-functional requirements

| Area | Requirement | How it is met |
|---|---|---|
| Performance | Public pages are served from cache | Static generation at build time, `unstable_cache` with tags, on-demand revalidation from the CMS, 10-minute ISR for post listings |
| Availability | Website and CMS fail independently | Two Vercel projects; a CMS outage does not take the cached website down |
| Security | Draft content and user data are not public | Access rules (`authenticatedOrPublished`, `authenticated`), preview secret + session check, secrets for revalidation and cron, CORS limited to the site and CMS origins |
| Privacy | Author e-mails are not exposed | Authors are copied into `populatedAuthors` with id and name only |
| Observability | Errors and performance are tracked per app | Sentry (events tagged `app: cms` / `app: web`), Vercel Analytics and Speed Insights on the website |
| Maintainability | One source of truth for the content model | Both apps import the same Payload config from `packages/core` |
| Runtime | Supported versions are pinned | Node.js 26.13.0 (`.nvmrc`, `engines`), Bun 1.4.4 |
