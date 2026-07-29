# 06 — Remove the user from the application layer

Status: ready-for-agent
Milestone: 1 — Data layer
Blocked by: 05

The schema lost identity in issue 04. This removes it from the roughly 25 pages
and route handlers that still ask who the user is (ADR 0003).

**Delete** `getUser`, `getUserId`, `getUserOrThrow`, `getUserOrRedirectToSignin`
and every call site. Callers include `app/(private)/layout.tsx`,
`app/(new-project)/layout.tsx`, and essentially every route under `app/api/`.

**`app/(private)/layout.tsx`** currently gates on auth, then redirects to
`/organization` when there is no Organization and to `/new-project` when there
are no Projects. Keep both redirects — they are the first-run flow — and drop
the auth gate.

**The Organization becomes a single settings row.** `getOrganizationRowWithOwnerId(user.id)`
becomes `getOrganization()`. `app/api/organization/[organizationId]/route.ts`
loses its `owner_id !== user.id` ownership check.

**Delete the admin concept.** `userProfile.role` is gone with `user_profiles`.
The `admin-tools` settings tab survives **ungated**, renamed to Developer — its
clone and backfill actions are genuinely useful. `app/api/admin/project/[projectId]/*`
(pause, archive, clone, delete, fill-prompt-responses) survive without the role
check; move them out of `admin/`.

Two pre-existing authorization bugs disappear rather than needing fixes: the
unauthenticated `app/api/process-prompts/[projectId]/force-one/route.ts`, and
`app/api/project/[projectId]/fetch-new-prompt-responses/route.ts` which
authenticated the caller but never checked the Project belonged to them.

`MessagesContext` keys dismissed banners on `messages:${userId}` in
localStorage — drop the user segment.

## Done when

- No occurrence of `getUser`, `author_id`, `owner_id`, `user_profiles` or
  `role === 'admin'` remains.
- `bun run build` succeeds and the dashboard renders against a seeded database.
