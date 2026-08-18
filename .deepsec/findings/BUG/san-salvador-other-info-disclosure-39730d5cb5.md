# [BUG] Raw upstream error.message echoed to client on non-401/403/429 failures

**File:** [`app/api/new-project/prompt-ideas/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/new-project/prompt-ideas/route.ts#L27-L35) (lines 27, 34, 35)
**Project:** san-salvador
**Severity:** BUG  •  **Confidence:** low  •  **Slug:** `other-info-disclosure`

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

Identical to the competitors route: toAiError classifies only 401/403/429 and quota text; all other APICallError values fall through to `NextResponse.json({ error: error instanceof Error ? error.message : error }, { status: 500 })`, leaking the upstream provider response body/message to a cross-origin caller.

## Recommendation

Return a fixed generic error string to the client and log the full error server-side only.

## Revalidation

**Verdict:** true-positive

Identical structure to F3 but in app/api/new-project/prompt-ideas/route.ts: toAiError classifies only 401/403/429 and quota text; all other APICallError values fall through to NextResponse.json({ error: error.message }, { status: 500 }), leaking upstream provider response bodies/diagnostics to a cross-origin caller. As with F3, provider keys travel as headers (not response bodies) and the bound url/name/categories params are already attacker-controlled via the query string, so the disclosure is limited to upstream diagnostics rather than credentials. Real but low-impact; adjusting severity to BUG.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-07-30)
