# [MEDIUM] Unauthenticated, unrate-limited POST triggers a full Collection Run (paid AI calls) — CSRF-reachable

**File:** [`app/api/process-prompts/[projectId]/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/process-prompts/[projectId]/route.ts#L4-L22) (lines 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `expensive-api-abuse`
**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

POST `/api/process-prompts/[projectId]` calls `createCollectionRun({ projectIds: [projectId], shouldForce })` followed by `ensureCollectionRunLoopIsRunning()`, which kicks off a Collection Run that sends prompts to every enabled chatbot provider (OpenAI, Google, Perplexity) using the operator's stored paid API keys, scrapes cited URLs, and runs analysis. There is no authentication, no rate limiting, and no Origin/CSRF check. Although the server is loopback-only by design, a POST with no body and no custom headers is CORS-safelisted (or trivially issued via an HTML form submission with `application/x-www-form-urlencoded`), so a malicious web page visited by the local user can issue this request cross-origin without a preflight. Repeated/forced runs (`shouldForce=true`) burn the operator's paid provider credits and generate network load. The `projectId` is user-controlled but only selects an existing project (single-tenant, so not a cross-tenant issue). The fallback error branch (line 20) echoes raw `error.message`, which can include drizzle SQL/param text.

## Recommendation

Add rate limiting per project and a same-origin/Origin check or CSRF token before starting a Collection Run. Require a non-safelisted request shape (e.g. JSON body with an `application/json` content-type header checked server-side) so cross-origin callers must pass a CORS preflight the loopback origin won't grant. Scrub `error.message` in the fallback branch.

## Revalidation

**Verdict:** true-positive

POST /api/process-prompts/[projectId] reads only projectId from the path and shouldForce from the query string — it does not read the request body — so a cross-origin HTML form POST with application/x-www-form-urlencoded (a CORS-safelisted content type requiring no preflight) reaches the handler. It calls createCollectionRun({ projectIds: [projectId], shouldForce }) and ensureCollectionRunLoopIsRunning(), kicking off a full Collection Run that sends prompts to every enabled chatbot provider (OpenAI/Google/Perplexity) using the operator's paid keys, scrapes cited URLs, and runs analysis. No auth, no rate limiting, no Origin/CSRF check. A malicious local web page can repeatedly force runs (shouldForce=true) to burn paid provider credits and generate network load. The line-20 fallback also echoes raw error.message (which for drizzle errors can carry SQL/param text). This is the CSRF-cost-abuse pattern the threat model calls out, not the 'missing auth by design' false positive. MEDIUM appropriate.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-08-03)

## Resolution

Same root cause and fix as `expensive-api-abuse-3c618e2c94.md` — see that finding's
Resolution section. `proxy.ts` (root, matcher `/api/:path*`) rejects any request whose
Origin/Referer names a foreign host with 403 before it reaches the route handler, including
the CORS-safelisted form-POST vector described here.

The raw `error.message` echo on the fallback branch (line 20), mentioned in this finding's
body, does not have its own deepsec finding file for this route (the two
`other-info-disclosure` BUG findings cover `prompt-ideas` and `competitors`, not
`process-prompts`) — left unaddressed here to keep this fix scoped to the
`expensive-api-abuse` slug's stated concern (CSRF-driven cost abuse).
