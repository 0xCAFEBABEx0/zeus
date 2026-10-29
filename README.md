# Zeus

Zeus is the content platform behind [ausor.ai](https://ausor.ai). It is built on [Payload CMS](https://payloadcms.com) and Next.js, started from the Payload website template.

The CMS and the website are separate Next.js apps in one Bun workspace, deployed as two Vercel projects:

- `apps/cms` → **cms.ausor.ai** (Payload admin, REST/GraphQL API, media, scheduled jobs)
- `apps/web` → **ausor.ai** (public website)
- `packages/core` → shared Payload config, collections, blocks and components

## Documentation

All project documentation lives in [`docs/`](./docs/README.md):

- [Specification](./docs/SPECIFICATION.md): what the system does
- [Architecture](./docs/ARCHITECTURE.md) and [Design](./docs/DESIGN.md): how it is built
- [Data model](./docs/DATA_MODEL.md) and [HTTP API](./docs/API.md)
- [Configuration](./docs/CONFIGURATION.md): environment variables
- [Development](./docs/DEVELOPMENT.md) and [Development workflow](./docs/DEVELOPMENT_WORKFLOW.md)
- [Deployment](./docs/DEPLOYMENT.md) and [Operations](./docs/OPERATIONS.md)
- [Known issues](./docs/KNOWN_ISSUES.md)

## Quick start

Requires Node.js 26.13.0, Bun 1.4.4 and a PostgreSQL database.

```bash
git clone https://github.com/0xCAFEBABEx0/zeus.git
cd zeus
bun install

cp .env.example apps/cms/.env
cp .env.example apps/web/.env
# edit both files (see docs/CONFIGURATION.md)

bun run dev
```

- Website: http://localhost:3000
- CMS: http://localhost:3001/admin

## Common scripts

| Script | Description |
|---|---|
| `bun run dev` | Start both apps (`dev:cms` / `dev:web` for one) |
| `bun run build` | Build both apps (`build:cms` / `build:web` for one) |
| `bun run lint` | ESLint |
| `bun run typecheck` | Type check both apps |
| `bun run generate:types` | Regenerate Payload TypeScript types |
| `bun run generate:importmap` | Regenerate the admin import map |

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md#scripts) for the full list.

## Release flow

`development` → `preview` (Vercel Preview) → `main` (Production, via pull request). Details in [docs/DEVELOPMENT_WORKFLOW.md](./docs/DEVELOPMENT_WORKFLOW.md).

## License

MIT
