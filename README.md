# AllSearch Local

Local-first desktop-style app that tracks how often a Brand is mentioned and cited by AI chatbots (ChatGPT, Google AI Mode, Perplexity), and turns gaps into content recommendations.

Single-user: data stays on the machine (SQLite). AI calls use the operator’s own provider keys (entered in Settings). Domain language lives in [`CONTEXT.md`](./CONTEXT.md).

## Prerequisites

- [Bun](https://bun.sh) (install + scripts + tests)
- Node.js 22+ (runtime for the Next.js server — see ADR 0010)
- Optional: provider API keys (OpenAI, Google, Perplexity) for live collection

## Get started

```bash
bun install
bun run db:seed:demo   # migrate + load demo fixture (skip if you want empty onboarding)
bun dev                # https://localhost:3000
```

Open the URL Next prints (default `https://localhost:3000`). Migrations run on server boot via `instrumentation.ts`.

### Database location

Default path:

| Platform | Path |
| -------- | ---- |
| macOS | `~/Library/Application Support/AllSearch/allsearch.db` |
| Windows | `%APPDATA%\AllSearch\allsearch.db` |
| Linux | `$XDG_DATA_HOME/AllSearch/allsearch.db` or `~/.local/share/AllSearch/allsearch.db` |

Override with `ALLSEARCH_DB_PATH` (used by tests and local experiments). See `.env.example`.

### Demo data

```bash
bun run db:seed:demo           # refuses if the DB already has user data
bun run db:seed:demo -- --force  # wipe user rows, then re-seed
```

After seeding, `bun dev` loads the dashboard with sample Projects — no onboarding required.

### HTTPS in dev

`bun dev` runs `next dev --experimental-https`. Next can generate local certs automatically; if the browser complains, trust the cert or generate ones with [mkcert](https://github.com/FiloSottile/mkcert).

## Run the application

| Command | Purpose |
| ------- | ------- |
| `bun dev` | Dev server (HTTPS, hot reload) |
| `bun dev:debug` | Dev server with Node inspector |
| `bun build` / `bun start` | Production build and serve |
| `bun run db:seed:demo` | Migrate + demo fixture without starting Next |

Provider keys: **Settings in the app**, not `.env` (ADR 0004). Optional env vars are documented in `.env.example`.

## Develop

### Stack

| Layer | Choice |
| ----- | ------ |
| App | Next.js 16 (App Router), React 19 |
| UI | Tailwind CSS v4, Untitled UI / React Aria |
| DB | SQLite via Drizzle (`libs/database/`, `drizzle/`) |
| AI | Vercel AI SDK + direct OpenAI / Google / Perplexity keys |
| Tooling | Bun (`install`, `test`, scripts); Node for the long-lived server |

More detail: [`docs/tech-stack.md`](./docs/tech-stack.md), ADRs under [`docs/adr/`](./docs/adr/).

### Everyday commands

```bash
bun lint              # ESLint
bun tsc               # Typecheck
bun prettier          # Format
bun test              # Unit tests (bun test)
bun test:watch
bun test:coverage
bun test:e2e          # Playwright (dev server must be up; see playwright.config.ts)
bun test:e2e:ui
bun run db:generate   # drizzle-kit generate from libs/database/schema.ts
bun run db:snapshot   # snapshot live DB → demo fixture (maintainers)
bun run verify:providers  # smoke-check configured providers
```

Full list: [`docs/commands.md`](./docs/commands.md).

### Layout

```
app/            # Routes: (private), (new-project), api/
components/     # application, base, foundations, collection-run
libs/
  database/     # schema, client, migrate, table queries
  collection/   # Collection Run loop and progress
  ai/           # provider calls and generation
drizzle/        # SQL migrations (applied on boot)
scripts/        # db seed/snapshot, verifyProviders
tests/          # unit + e2e
docs/           # stack, patterns, ADRs, agent tracker docs
CONTEXT.md      # ubiquitous language
DESIGN.md       # UI system
```

Conventions: [`docs/development-guidelines.md`](./docs/development-guidelines.md), [`docs/patterns.md`](./docs/patterns.md), [`docs/project-structure.md`](./docs/project-structure.md).

### Schema changes

1. Edit `libs/database/schema.ts`
2. `bun run db:generate`
3. Review SQL under `drizzle/`
4. Boot the app (or `db:seed:demo`) so `migrateDatabase` applies forward-only migrations (with backup — ADR 0006)

### Agent / product context

- [`CONTEXT.md`](./CONTEXT.md) — domain terms (Project, Collection Run, Visibility, …)
- [`AGENTS.md`](./AGENTS.md) — issue tracker under `.scratch/`, triage labels, domain docs
- [`docs/adr/`](./docs/adr/) — architectural decisions (SQLite, no gateway keys, CLI-first ship, …)

## Packaging note

Today this is a **local Next.js app** you run with Bun. Shipping as a CLI that opens the browser (and a later Electron shell) is decided in ADR 0010; distribution is not npm-published from this README yet.
