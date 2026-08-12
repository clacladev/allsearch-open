# AllSearch Local

Local-first desktop-style app that tracks how often a Brand is mentioned and cited by AI chatbots (ChatGPT, Google AI Mode, Perplexity), and turns gaps into content recommendations.

Single-user: data stays on the machine (SQLite). AI calls use the operator’s own provider keys (entered in Settings). Domain language lives in [`CONTEXT.md`](./CONTEXT.md).

## Prerequisites

- [Bun](https://bun.sh) (install + scripts + tests)
- Node.js 22+ (runtime for the Next.js server — see ADR 0010)
- Optional: provider API keys (OpenAI, Google, Perplexity) for live collection

## Run it

```bash
bun run build:package && bun run start:cli   # from a checkout, today
bunx allsearch                               # once published — see Packaging note
```

Either boots the app's own server on a free port and opens your browser at it. The URL is printed
so you can reopen it later. Press Ctrl-C to quit.

| Flag                  | Effect                                     |
| --------------------- | ------------------------------------------ |
| `--port <n>`          | Use exactly this port; fail if it is taken |
| `--no-open`           | Print the URL, don't open a browser        |
| `--version`, `--help` | As expected                                |

Notes:

- The server listens on `127.0.0.1` only. There is no login anywhere in the app and the database
  holds your provider keys, so it is never exposed to your network.
- Only one instance can run against a given database — a second is refused rather than allowed to
  race the first. Two writers on one SQLite file can corrupt it.
- Quitting during a Collection Run is safe: the run is returned to `pending` and resumes the next
  time you start the app.
- Requires Node.js 22.5+ on PATH (`node:sqlite`). `bunx` and `npx` both run it under Node — see
  ADR 0010 for why the server does not run under Bun.

## Get started (development)

```bash
bun install
bun run db:seed:demo   # migrate + load demo fixture (skip if you want empty onboarding)
bun dev                # http://localhost:3000
```

Open the URL Next prints (default `http://localhost:3000`). Migrations run on server boot via `instrumentation.ts`.

### Database location

Default path:

| Platform | Path                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| macOS    | `~/Library/Application Support/AllSearch/allsearch.db`                             |
| Windows  | `%APPDATA%\AllSearch\allsearch.db`                                                 |
| Linux    | `$XDG_DATA_HOME/AllSearch/allsearch.db` or `~/.local/share/AllSearch/allsearch.db` |

Override with `ALLSEARCH_DB_PATH` (used by tests and local experiments). See `.env.example`.

### Demo data

```bash
bun run db:seed:demo           # refuses if the DB already has user data
bun run db:seed:demo -- --force  # wipe user rows, then re-seed
```

After seeding, `bun dev` loads the dashboard with sample Projects — no onboarding required.

## Run the application

| Command                   | Purpose                                             |
| ------------------------- | --------------------------------------------------- |
| `bun dev`                 | Dev server (HTTP, hot reload)                       |
| `bun dev:debug`           | Dev server with Node inspector                      |
| `bun build` / `bun start` | Production build and serve                          |
| `bun run build:package`   | Production build + CLI bundle, ready to `npm pack`  |
| `bun run start:cli`       | Run the built CLI exactly as `bunx allsearch` would |
| `bun run db:seed:demo`    | Migrate + demo fixture without starting Next        |

Provider keys: **Settings in the app**, not `.env` (ADR 0004). Optional env vars are documented in `.env.example`.

## Develop

### Stack

| Layer   | Choice                                                           |
| ------- | ---------------------------------------------------------------- |
| App     | Next.js 16 (App Router), React 19                                |
| UI      | Tailwind CSS v4, Untitled UI / React Aria                        |
| DB      | SQLite via Drizzle (`libs/database/`, `drizzle/`)                |
| AI      | Vercel AI SDK + direct OpenAI / Google / Perplexity keys         |
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
bun test:e2e          # Playwright; builds the app and starts isolated servers automatically
bun test:e2e:ai       # On-demand AI-tagged Playwright specs
bun test:e2e:ui
bun run db:generate   # drizzle-kit generate from libs/database/schema.ts
bun run db:snapshot   # snapshot live DB → demo fixture (maintainers)
bun run verify:providers  # smoke-check configured providers
```

Full list: [`docs/commands.md`](./docs/commands.md).

### End-to-end tests

`bun test:e2e` runs the continuously-green browser suite: it builds a golden SQLite database from
`scripts/fixtures/demo-data.json`, then each test copies that database and starts its own local
Next.js server. No dev server, login, or provider key is needed, and tests can run in parallel.

Specs tagged `@ai` are excluded from that default suite because they exercise generation flows.
Run them on demand with `bun test:e2e:ai` and a live provider key when the spec requires one; this
keeps provider costs and flaky network calls out of the normal test signal.

### Layout

```
app/            # Routes: (private), (new-project), api/
cli/            # `bunx allsearch`: port choice, browser, single-instance lock
components/     # application, base, foundations, collection-run
libs/
  database/     # schema, client, migrate, table queries
  collection/   # Collection Run loop and progress
  ai/           # provider calls and generation
drizzle/        # SQL migrations (applied on boot)
scripts/        # db seed/snapshot, verifyProviders, buildCli
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

`bun run build:package` produces everything the npm package ships: the Next.js standalone server
under `.next/standalone/`, the CLI bundle at `dist/cli.mjs`, and the migrations under `drizzle/`.
`npm pack` (via `prepack`) runs it for you.

**The package is not published, and is marked `private` so it cannot be published by accident.**
Publishing is a deliberate, manual step the maintainer takes at the end of the process. Until
then `bunx allsearch` does not resolve — build and pack locally to try the CLI:

```bash
bun run build:package && bun run start:cli
```

A desktop shell (Electron, not Tauri) is deferred to public launch — see ADR 0010.
