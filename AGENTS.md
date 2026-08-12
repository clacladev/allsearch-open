# AGENTS.md

## Product snapshot

AllSearch **Local**: single-user, local-first port of AllSearch. SQLite + Drizzle, Next.js 16, Bun toolchain, operator-owned AI keys. Domain language: `CONTEXT.md`. Human README (setup / run / develop): `README.md`.

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

## Never publish

This project stays private until the maintainer publishes it **manually**, by hand, at the end of
the process. Until then:

- Do not run `npm publish` (or `bun publish`, or any registry push), and do not ask to.
- `"private": true` in `package.json` is the guard that enforces this. Leave it there. It does not
  block `bun run build:package` or `npm pack`, which are the only packaging steps agents should run.
- `bunx allsearch` therefore does not resolve yet, and is not expected to. Build and pack locally
  to verify the CLI; never treat "publish it and see" as a verification step.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
