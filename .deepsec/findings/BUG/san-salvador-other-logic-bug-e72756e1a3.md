# [BUG] getPromptResponsesWorkRows dedup keeps oldest response of the day instead of latest when input is DESC-sorted

**File:** [`libs/utils/project-analysis/helpers.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/libs/utils/project-analysis/helpers.ts#L95-L98) (lines 95, 96, 97, 98)
**Project:** san-salvador
**Severity:** BUG  •  **Confidence:** high  •  **Slug:** `other-logic-bug`

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

getPromptResponsesWorkRows deduplicates rows sharing a (created_at_iso_date, prompt_id, chatbot_id) key by deleting then re-setting the map entry, so the LAST row encountered for a key in input order wins. The inline comment ('keep only the latest one of the day (assuming responses are sorted by created_at)') and the unit test 'deduplicates same prompt+chatbot+day, keeping the last one' both assume input is ASCENDING by created_at (the test feeds 08:00 then 16:00 and expects r-later to win). In production, every caller pulls rows from getPromptResponse(Summary)RowsWithProjectIdInDateRange, which uses .orderBy(desc(promptResponses.created_at)) (libs/database/PromptResponses/queries.ts:44,73,92) — newest first. With DESC input, the last row encountered for a key is the OLDEST response of that day, so dedup keeps a stale response instead of the most recent. This affects getOverviewData (visibility/sentiment datasets, scores), the prompt-articles opportunities route, the new-article page, opportunities helpers, and sources helpers — all feed off getPromptResponsesWorkRows. The contradictory comment in getLatestCollectionGroup ('rows arrive DESC from the DB and are then re-emitted in Map insertion order by getPromptResponsesWorkRows') confirms the DESC reality. Whenever a prompt+chatbot produced multiple responses on the same ISO day, charts/summaries/rankings are computed from an earlier response rather than the latest. No SQLite data is lost or corrupted; only derived analysis correctness is affected.

## Recommendation

Make selection explicit instead of relying on input order: track max created_at per key (overwrite only when response.created_at is strictly greater than the stored entry's created_at), or sort input ascending by created_at before the dedup loop, or change the feeding DB queries to orderBy(asc(...)). Add a regression test feeding DESC-ordered input (matching real query order) asserting the latest response is retained.

## Revalidation

**Verdict:** true-positive

getPromptResponsesWorkRows deduplicates by `delete(key); set(key, response)`, so the LAST row encountered for each (created_at_iso_date, prompt_id, chatbot_id) key in input order wins. The inline comment assumes input is sorted ascending by created_at, but every feeding query in libs/database/PromptResponses/queries.ts uses `.orderBy(desc(promptResponses.created_at))` (lines 44, 73, 92 — newest first). With DESC input, the last row encountered for a key is the OLDEST response of that day, so dedup keeps a stale response instead of the latest. The contradictory comment in getLatestCollectionGroup ('rows arrive DESC from the DB') confirms the real ordering. This corrupts derived analysis (visibility/sentiment datasets, scores, opportunities, sources) for any prompt+chatbot with multiple same-ISO-day responses. No SQLite data is lost; it is a correctness bug in derived computations, matching the BUG severity. A concrete reproduction: two responses for the same prompt+chatbot on one day (08:00 and 16:00) yield the 08:00 row retained, not the 16:00 one.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-08-07)
