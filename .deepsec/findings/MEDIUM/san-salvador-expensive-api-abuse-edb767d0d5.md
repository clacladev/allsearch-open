# [MEDIUM] Unauthenticated, unrate-limited GET triggers paid Google AI calls (CSRF-reachable)

**File:** [`app/api/new-project/topics-ideas/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/new-project/topics-ideas/route.ts#L6-L27) (lines 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `expensive-api-abuse`
**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

GET `/api/new-project/topics-ideas?url=...&name=...` calls `getTopicsIdeas(url, name)` (libs/ai/topicsIdeas/getTopicsIdeas.ts), which performs TWO `generateText` calls to Google's `gemini-3.1-flash-lite` model using the operator's stored (paid) API key, with `google.tools.urlContext` and `google.tools.googleSearch` enabled. There is no authentication, no rate limiting, and the endpoint is a simple GET with safelisted query params. Because the product is loopback-only with no auth/CSRF/Origin enforcement by design, any web page the local user visits can issue cross-origin GET requests to this endpoint; the AI side-effect (spending the operator's Google quota/credits) happens regardless of CORS read-blocking. An attacker page can loop this to burn the operator's paid AI quota. The `url` and `name` values are also interpolated directly into the research system prompt, giving a CSRF-driven attacker control of LLM input context (prompt-injection surface), though output is schema-constrained to a short string array. The fallback error branch (line 25) echoes raw `error.message`, which can include upstream AI SDK error text.

## Recommendation

Add rate limiting and require a same-origin/Origin check (or a CSRF token) for endpoints that invoke paid AI APIs, even on the loopback server. Consider making the endpoint POST with a JSON body and a custom content-type so cross-origin requests require a CORS preflight that the loopback origin won't grant. Scrub `error.message` in the fallback branch.

## Revalidation

**Verdict:** true-positive

GET /api/new-project/topics-ideas?url=&name= calls getTopicsIdeas (verified in libs/ai/topicsIdeas/getTopicsIdeas.ts), which performs two generateText calls to gemini-3.1-flash-lite with google.tools.urlContext and google.tools.googleSearch enabled, using the operator's stored paid key. No auth, no rate limiting, no Origin/CSRF check, and a simple GET with safelisted query params — so any web page the local user visits can loop cross-origin GETs to burn paid AI quota; the cost side-effect occurs regardless of CORS read-blocking. url/name are also interpolated directly into the research system prompt, giving a CSRF-driven attacker control of LLM input context (prompt-injection surface), though output is schema-constrained. The line-25 fallback also echoes raw error.message. Distinct file from F2/F5, so not a duplicate. MEDIUM appropriate.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-07-30)

## Resolution

Same root cause and fix as `expensive-api-abuse-3c618e2c94.md` — see that finding's
Resolution section. `proxy.ts` (root, matcher `/api/:path*`) now rejects cross-origin GETs
to this route with 403, closing the CSRF vector for both the cost-abuse and (as a side
effect) the prompt-injection-surface concerns mentioned in this finding.

The raw `error.message` echo (line 25) does not have its own deepsec finding file for this
route and is left unaddressed here, same reasoning as `expensive-api-abuse-e57139c507.md`.
