# AGENTS.md

## Product snapshot

AllSearch: single-user, local-first product. SQLite + Drizzle, Next.js 16, Bun toolchain, operator-owned AI keys. Domain language: `CONTEXT.md`. Human README (setup / run / develop): `README.md`.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles used as-is — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix` — recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## When changing code

- Package manager: **bun** only (`docs/development-guidelines.md`).
- DB access: Drizzle under `libs/database/` — never invent a second data layer (`docs/patterns.md`, ADR 0006).
- Routes: `RouteHelper` / `ROUTES` in `libs/routes.ts`.
- After substantive edits: `bun lint`, `bun tsc`, and relevant `bun test` / e2e.

## Publishing

- Publishing a version to npm (`npm publish`) is the maintainer's own deliberate action, not
  something an agent runs unprompted. Only do it if explicitly asked to in the session.
- `bun run build:package` and `npm pack` remain the packaging steps for verifying the CLI locally
  without publishing. See the README's Packaging note for the actual publish steps.
- `bunx allsearch` only resolves once a version has actually been published to npm.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
