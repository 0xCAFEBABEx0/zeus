# Zeus documentation

Zeus is the content platform behind **ausor.ai**. It is a Bun workspace with two Next.js apps that share one Payload CMS configuration and one PostgreSQL database:

- `apps/cms` → **cms.ausor.ai**: Payload admin panel, REST/GraphQL API, media, scheduled jobs
- `apps/web` → **ausor.ai**: the public website
- `packages/core`: shared Payload config, collections, blocks, components and utilities

## Documents

| Document | What it covers | Read it when |
|---|---|---|
| [SPECIFICATION.md](./SPECIFICATION.md) | Product scope, users, functional and non-functional requirements | You need to know what the system does |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System context, the two apps, how they talk to each other, request flows | You need the big picture |
| [DESIGN.md](./DESIGN.md) | Code layout, module responsibilities, rendering and caching, preview, extension recipes | You are changing code |
| [DATA_MODEL.md](./DATA_MODEL.md) | Collections, globals, blocks, fields, access rules, database tables, migrations | You are changing content types or the database |
| [API.md](./API.md) | Every HTTP endpoint of both apps, including the CMS → website revalidation contract | You call or add an endpoint |
| [CONFIGURATION.md](./CONFIGURATION.md) | Environment variables per app and per environment | You set up an environment or add a variable |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel projects, environments, domains, builds, Docker, database changes, rollback | You ship a change |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Local setup, scripts, Payload CLI, seeding, troubleshooting | You start working on the code |
| [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) | Branches, commits, pull requests, CI, hotfixes | You commit, push or open a PR |
| [OPERATIONS.md](./OPERATIONS.md) | Monitoring (Sentry, Vercel Analytics, Checkly), cron jobs, runbooks | Something breaks in production |
| [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) | Leftovers from the template, inconsistencies and technical debt | You plan clean-up work |

## Keeping the docs current

- The docs describe the code on `main`. Update them in the same change that alters behaviour, configuration or the data model.
- Write documentation, pull requests and commit messages in English.
- Prefer linking to the source file over copying code; code snippets go stale quickly.
