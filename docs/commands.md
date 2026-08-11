# Common Commands

```bash
bun install           # Install dependencies
bun dev               # Start dev server (https://localhost:3000)
bun dev:debug         # Dev server with Node.js inspector
bun build             # Production build (Next.js standalone output)
bun start             # Serve production build
bun run build:package # Production build + CLI bundle + standalone asset copy
bun run build:cli     # CLI bundle + standalone asset copy (after bun build)
bun run start:cli     # Run the built CLI exactly as `bunx allsearch` would
bun lint              # ESLint
bun tsc               # Typecheck (tsc --noEmit)
bun prettier          # Format with Prettier
bun test              # Unit tests (bun test)
bun test:watch        # Unit tests in watch mode
bun test:coverage     # Unit tests with coverage
bun test:e2e          # Playwright e2e (dev server running)
bun test:e2e:ui       # Playwright interactive UI
bun run verify:providers  # Smoke-check AI providers
```

> **Note:** `bun dev` uses `--experimental-https`. Prefer trusting Next’s local certs or [mkcert](https://github.com/FiloSottile/mkcert).

## Database

```bash
bun run db:generate              # drizzle-kit generate from libs/database/schema.ts
bun run db:seed:demo             # migrate + load scripts/fixtures/demo-data.json
bun run db:seed:demo -- --force  # wipe user data, then re-seed
bun run db:snapshot              # snapshot current DB into the demo fixture
```

- Default DB path: platform app-data dir (`…/AllSearch/allsearch.db`). Override with `ALLSEARCH_DB_PATH`.
- Migrations also run automatically when the Next server starts (`instrumentation.ts`).

## Shipping the CLI

```bash
bun run build:package   # what `prepack` runs: next build, then scripts/buildCli.ts
npm pack                # tarball containing .next/standalone, dist/, drizzle/
```

`build:cli` bundles `cli/` to `dist/cli.mjs`, copies `.next/static` and `public/` into
`.next/standalone/` (Next leaves them out, assuming a CDN), and prunes everything else out of the
standalone tree — the file tracer copies the whole repository in, for the reason documented in
`next.config.ts`.

```bash
allsearch                # free port, opens your browser
allsearch --port 4000    # exact port, or fail if it is taken
allsearch --no-open      # print the URL only
allsearch --version
```

The server binds `127.0.0.1` only, and a second instance against the same database is refused via
a lock file next to it (two writers is a corruption route). Ctrl-C returns any in-flight
Collection Run to `pending` so it resumes on the next start.

## Environment

Copy only what you need from `.env.example`. Provider API keys are **not** env vars — they are stored in Settings (SQLite). For Playwright, optional `PLAYWRIGHT_BASE_URL` (default `https://localhost:3000`).
