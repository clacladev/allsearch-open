# [MEDIUM] Unauthenticated expensive AI API call reachable via CSRF

**File:** [`app/api/new-project/competitors/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/new-project/competitors/route.ts#L8-L24) (lines 8, 21, 24)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `expensive-api-abuse`

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

GET /api/new-project/competitors has no auth, no Origin/CSRF check, and no rate limiting, and it invokes getCompetitors(), which makes two `generateText` calls to Google's Gemini API (gemini-3.1-flash-lite) plus the url_context/google_search paid tools, using the operator's stored API key. Because the server is loopback-only with no token or Origin enforcement, any web page the operator visits can issue cross-origin GETs to this endpoint (simple GET, no preflight needed) and repeatedly burn the operator's Google AI quota / incur cost. The `url`/`name`/`categories` params are fully attacker-controlled via query string.

## Recommendation

Require a same-origin check (Origin/Referer allowlist or a CSRF token) for state-changing or expensive endpoints, and add per-endpoint rate limiting / concurrency caps for AI-calling routes. At minimum, restrict these routes to same-origin requests.

## Revalidation

**Verdict:** true-positive

GET /api/new-project/competitors has no auth, Origin/CSRF check, or rate limiting, and calls getCompetitors which (confirmed in libs/ai/competitors/getCompetitors.ts) makes two generateText calls to gemini-3.1-flash-lite with the paid google_search and url_context tools using the operator's stored Google API key. It is a simple GET (no preflight) with safelisted query params, so any web page the operator visits can issue cross-origin GETs that burn paid quota — the AI side-effect occurs regardless of CORS read-blocking of the response. This is not the 'missing auth by design' false positive because it is combined with a concrete cost/abuse side-effect, exactly the CSRF concern called out in the threat model. MEDIUM is appropriate.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-07-30)
