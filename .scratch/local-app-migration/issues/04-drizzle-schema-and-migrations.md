# 04 — Drizzle schema and migrations

Status: ready-for-agent
Milestone: 1 — Data layer
Blocked by: 03

Define the SQLite schema in Drizzle (`drizzle-orm/node-sqlite`) and wire up
migrations. Reference: `supabase/migrations/` in the SaaS, flattened to the final
state — do not replay 26 migrations, write the end state as migration one.

**Tables:** `organizations`, `projects`, `competitors`, `topics`, `prompts`,
`prompt_responses`, `sources`, `prompt_articles`, plus the new
`collection_runs` and `collection_run_items` (specified in issue 10).

**Drop entirely:** `user_profiles`, everything referencing `auth.users`, all
`author_id` columns, all `organization_id` columns on child tables, all RLS
policies and grants, and all five plpgsql functions. `delete_project_cascade`
becomes `ON DELETE CASCADE`; `update_updated_at` triggers become application
code or Drizzle `$onUpdate`.

**Type mapping:**

| Postgres | SQLite |
|---|---|
| `uuid` | `text` (keep UUID values, ADR 0006) |
| `timestamptz` | `text`, ISO 8601 UTC |
| enums `chatbot_id`, `organization_type` | `text` with a CHECK constraint |
| `text[]`, `uuid[]` (`aliases`, `brand_ids_ranking`) | `text({ mode: 'json' })` |
| `jsonb` (`sentiment`, `headings`, `outline`, …) | `text({ mode: 'json' })` |

JSON columns are safe: the SaaS never filtered on them in SQL. The entire query
surface in use is 14 builder methods with no `.contains`, no `.overlaps` and no
JSON operators — rows are selected whole and computed over in JS.

`organizations` loses `owner_id` and becomes a single settings row (ADR 0003).

**Migration runner.** Migrations run at application startup, forward-only.
**Copy the database file to a timestamped backup before running any migration.**
On a server a failed migration is an outage; here it is a stranger's
irreplaceable data, and Collection Run history cannot be recreated.

**Database location:** platform application-data directory, e.g.
`~/Library/Application Support/AllSearch/allsearch.db` on macOS. Overridable by
an env var for tests.

## Done when

- `drizzle-kit` generates and applies the initial migration to a fresh file.
- Startup on an existing database backs it up, then migrates.
- A round-trip test writes and reads every JSON and array column.
