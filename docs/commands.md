# Common Commands

```bash
bun install           # Install dependencies
bun dev               # Start dev server (https://localhost:3000)
bun dev:debug         # Dev server with Node.js inspector
bun build             # Production build
bun start             # Serve production build
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

## Environment

Copy only what you need from `.env.example`. Provider API keys are **not** env vars — they are stored in Settings (SQLite). For Playwright, optional `PLAYWRIGHT_BASE_URL` (default `https://localhost:3000`).
