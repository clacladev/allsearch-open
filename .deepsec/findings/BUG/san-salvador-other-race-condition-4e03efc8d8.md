# [BUG] TOCTOU race in competitor uniqueness checks (no DB unique constraint)

**File:** [`app/api/project/[projectId]/competitors/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/project/[projectId]/competitors/route.ts#L60-L122) (lines 60, 75, 85, 108, 115, 122)
**Project:** san-salvador
**Severity:** BUG  •  **Confidence:** medium  •  **Slug:** `other-race-condition`

**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

POST (lines ~60-85) and PATCH (lines ~108-122) enforce name/URL uniqueness in application logic: they read all competitors for the project with getCompetitorRowsWithProjectId, filter/ring them in JS, and then insert or update. The competitors table has NO unique constraint on (project_id, url) or (project_id, name) (confirmed in libs/database/schema.ts). Two concurrent requests with the same URL or name can both pass the isCompetitorUnique / some(...) check and both write, creating duplicate active competitors that the uniqueness logic is supposed to prevent. The archived-competitor 'restore instead of insert' path in POST has the same window: two concurrent POSTs for an archived URL can both miss the archivedMatch lookup and both insert new rows. Impact is limited (single-user loopback app, data-integrity only, no security boundary crossed), hence BUG rather than HIGH_BUG.

## Recommendation

Add a partial unique index on (project_id, url) and (project_id, name) where is_archived = 0, and rely on the constraint (catching the unique-violation error) instead of check-then-write application logic; or serialize these writes per project.

## Revalidation

**Verdict:** true-positive

Confirmed real and reproducible. `libs/database/schema.ts` defines the `competitors` table with only a non-unique index `competitors_project_id_is_archived_updated_at_idx` — there is NO unique constraint on (project_id, url) or (project_id, name). POST and PATCH enforce uniqueness purely in application logic: they call `getCompetitorRowsWithProjectId`, filter/ring in JS (`isCompetitorUnique` / `activeCompetitors.some(...)`), then insert/update. Two concurrent requests with the same URL/name both observe the pre-existing set as 'unique' and both write, defeating the check-then-write guard; the archived-restore path has the same TOCTOU window (two concurrent POSTs for an archived URL both miss `archivedMatch` and both insert). Concrete reproduction: two simultaneous POSTs (e.g. double-submit from two tabs) with the same competitor URL create duplicate active rows. This is a data-integrity bug, not a security boundary crossing — correctly scoped as BUG severity given the single-user loopback design.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-07-29)
