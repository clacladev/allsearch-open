# 05 — Port the query layer to Drizzle

Status: ready-for-agent
Milestone: 1 — Data layer
Blocked by: 04

Rewrite the 59 surviving query functions in `libs/database/*/queries.ts` off the
Supabase PostgREST client and onto Drizzle. Delete `libs/database/supabase/`
entirely.

Modules and function counts: `PromptResponses` 10, `PromptArticles` 9, `Sources`
8, `Prompts` 8, `Projects` 7, `Competitors` 7, `Topics` 6, `Organizations` 6.
(`UserProfiles` and `UserSessions` were deleted in issue 02.)

The job is smaller than it looks. The whole builder surface in use is:

```
.eq ×62   .select ×59   .order ×20   .single ×17   .maybeSingle ×12
.insert ×12   .update ×10   .delete ×8   .lt ×5   .gte ×5
.in ×4   .rpc ×3   .limit ×1   .is ×1
```

Most functions are one equality filter. Of the three `.rpc()` calls, two were
auth session lookups (gone) and one was `delete_project_cascade`, now a foreign
key cascade.

**Do not build a Supabase-shaped shim over SQLite.** It is tempting because it
would leave `queries.ts` untouched, but it means owning a home-grown PostgREST
forever and keeps the `asAdmin` vestige alive (ADR 0006).

**Delete the `QueryOptions` / `asAdmin` parameter from every signature.** It
existed only to choose between the RLS-bound client and the service-role client.
There is no RLS and no service role. Around 60 call sites pass `asAdmin: true`
and all of them simplify.

**Replace the hand-written `*Row` types** in `libs/database/*/types.ts` with
Drizzle's inferred types. These were free to drift from the real schema and there
were no generated Supabase types; this removes that whole class of bug.

## Done when

- No file imports `@supabase/supabase-js` or `@supabase/ssr`; both are removed
  from `package.json`.
- `bun run tsc` passes with no `asAdmin` anywhere.
- `tests/unit/project-analysis/` is still green — the analysis layer must not
  have noticed this change.
