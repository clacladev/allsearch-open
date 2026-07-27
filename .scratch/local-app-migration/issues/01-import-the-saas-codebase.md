# 01 — Import the SaaS codebase

Status: ready-for-agent
Milestone: 0 — Import and safety net
Blocked by: none

Copy the working tree of `~/Dev/web/allsearch-bamboo` into this repository as a
single commit. No history graft: the SaaS is frozen and there will never be a fix
to cherry-pick (ADR 0001).

**Do not copy:** `.git/`, `.env.local`, `.vercel/`, `.next*`, `node_modules/`,
`tsconfig.tsbuildinfo`, `.swc/`, `.DS_Store`, `certificates/`,
`supabase/.branches/`, `.conductor/`, `.deepsec/`.

`.env.local` contains live production credentials (`SUPABASE_SECRET_KEY`,
`AI_GATEWAY_API_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, a Google
OAuth secret). It must not cross over under any circumstances. Instead write a
`.env.example` naming the variables and what each is for, with no values. Tell
the maintainer to rotate the originals.

Keep the existing `CLAUDE.md` / `AGENTS.md` / `docs/agents/` of *this* repo;
merge anything still relevant from the SaaS's `CLAUDE.md` and `docs/` rather than
overwriting.

## Done when

- `bun install` succeeds.
- `bun run tsc` passes.
- `git log` shows one import commit and no secrets in the tree.
