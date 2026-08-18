# [MEDIUM] Unauthenticated expensive AI API call reachable via CSRF

**File:** [`app/api/new-project/prompt-ideas/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/new-project/prompt-ideas/route.ts#L6-L19) (lines 6, 16, 19)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `expensive-api-abuse`
**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

GET /api/new-project/prompt-ideas has no auth, no Origin/CSRF check, and no rate limiting, and invokes getPromptsIdeas(), which makes two `generateText` calls to Google Gemini (gemini-3.1-flash-lite) plus the paid url_context/google_search tools using the operator's stored key. Because it is a simple GET with no preflight and no same-origin enforcement on the loopback server, any web page the operator visits can repeatedly trigger this paid call and exhaust the operator's quota / incur cost. All inputs (url/name/categories) are attacker-controlled via the query string.

## Recommendation

Enforce a same-origin check (Origin/Referer allowlist or CSRF token) and add rate limiting / concurrency caps for AI-calling routes.

## Revalidation

**Verdict:** true-positive

GET /api/new-project/prompt-ideas has no auth, Origin/CSRF check, or rate limiting and calls getPromptsIdeas, which (per the finding and the same libs/ai/promptsIdeas module pattern as the verified getCompetitors/getTopicsIdeas) makes paid Gemini generateText calls with url_context/google_search tools using the operator's stored key. It is a simple GET with safelisted query params, so any web page the operator visits can issue cross-origin GETs and exhaust paid quota without a preflight. Same exploit shape as F2, distinct file/location, so not a duplicate. MEDIUM appropriate.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-07-30)

## Resolution

Same root cause and fix as `expensive-api-abuse-3c618e2c94.md` — see that finding's
Resolution section. `proxy.ts` (root, matcher `/api/:path*`) now rejects any cross-origin
request to this route with 403.
