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
