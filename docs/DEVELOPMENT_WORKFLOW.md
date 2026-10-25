# Development workflow

## Branches

```
development ──merge──▶ preview ──pull request──▶ main
 (not deployed)        (Preview)                 (Production)
```

| Branch | Purpose | Deployed to | How changes arrive |
|---|---|---|---|
| `development` | Integration of day-to-day work | Nothing | Direct push (feature branches optional) |
| `preview` | Staging; what is about to ship | Vercel Preview (`preview.ausor.ai`) | Direct push: merge `development` into it |
| `main` | Production | Vercel Production (`ausor.ai`, `cms.ausor.ai`) | Pull request from `preview` only |
| `hotfix/*` | Urgent production fixes | Nothing until merged | Branch from `main`, PR into `main` |

No pull requests are needed for `development` and `preview`.

## Normal change

```bash
git checkout development
git pull origin development
# ... make the change, run lint / generate:types / typecheck ...
git commit -m "feat: add newsletter block"
git push origin development

# Ship to Preview
git checkout preview
git pull origin preview
git merge development        # same as `bun run deploy:preview`
git push origin preview
```

Then:

1. Wait for CI and both Vercel preview deployments, and check the change on Preview.
2. If the change includes a schema migration, apply it to the target database first (see [DEPLOYMENT.md](./DEPLOYMENT.md#database-changes)).
3. Open a pull request from `preview` into `main`, written in English, and merge it once checks pass.
4. Verify production.

## Commits and pull requests

- Commit messages, pull request titles and descriptions, code comments and documentation are written in **English**.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `ci:`, `refactor:`, `perf:`, `test:`. Keep the subject under about 72 characters and explain the why in the body.
- Keep commits focused; do not mix formatting-only changes with behaviour changes.
- A `preview` → `main` pull request should summarise what is being released, any manual steps (database migrations, new environment variables, Vercel settings) and how it was verified on Preview.
- Assign the pull request to the repository owner.

## Continuous integration

| Workflow | Trigger | Jobs |
|---|---|---|
| `deploy.yml` / `deployment.yml` ("Deploy to Vercel") | Push to `main` or `preview`, PR into `main` | Install with Bun (frozen lockfile), `bun run lint`, `bun run generate:types`, `bun run typecheck`. The Vercel deploy jobs are commented out; deployments come from the Vercel Git integration. |
| `codeql.yml` | Push to `main`, `preview`, `development`; PR into `main`; weekly (Monday 10:36 UTC) | CodeQL analysis for JavaScript/TypeScript |

The two "Deploy to Vercel" workflows are identical, so each run appears twice; see [KNOWN_ISSUES.md](./KNOWN_ISSUES.md). Pushes to `development` only run CodeQL, so run the checks locally before pushing.

## Hotfixes

```bash
git checkout main && git pull origin main
git checkout -b hotfix/<short-name>
# fix, commit, push, open a PR into main and merge it
git checkout preview && git pull origin preview && git merge main && git push origin preview
git checkout development && git pull origin development && git merge preview && git push origin development
```

Merge the fix back so `preview` and `development` do not reintroduce the bug.

## Recommended repository settings

- Protect `main`: require a pull request and passing status checks ("Lint and Type Check"), block force pushes.
- Leave `development` and `preview` open for direct pushes, but block force pushes.
- Enable Dependabot or Renovate for dependency updates and review Payload/Next.js upgrades on Preview before merging.
