# [MEDIUM] Outbound-fetch tool endpoint has no rate limiting or abuse protection

**File:** [`app/api/tools/ai-crawl-checker/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/tools/ai-crawl-checker/route.ts#L12-L16) (lines 12, 13, 16)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `rate-limit-bypass`
**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

POST /api/tools/ai-crawl-checker performs multiple server-side outbound fetches per request (robots.txt plus up to a 3 MB page HTML, each following up to 3 redirects with 10s timeouts, plus DNS resolution) with no rate limiting, concurrency cap, or per-host throttle. Because the endpoint has no auth/Origin/CSRF check (by design, per cli/runtime.ts), any web page in the operator's browser can repeatedly POST arbitrary URLs and coerce the local machine into making large volumes of outbound requests — a CSRF-driven DoS / network-abuse vector and an amplification primitive for the SSRF issue. There is also no de-duplication beyond the 15-minute robots.txt cache, so concurrent identical requests each trigger a full page fetch.

## Recommendation

Add rate limiting (per-host and global) and a concurrency cap on outbound fetches for this endpoint, and validate Origin / require a same-origin CSRF token on the POST since the server has no auth layer. Consider capping concurrent in-flight checkAICrawlability calls.

## Revalidation

**Verdict:** true-positive

Confirmed in app/api/tools/ai-crawl-checker/route.ts: the POST handler calls checkAICrawlability with no rate limiting, no concurrency cap, no per-host throttle, and no Origin/CSRF check (consistent with the documented local-first no-auth design). checkAICrawlability issues multiple outbound fetches per call (robots.txt plus up to a 3MB page, each following up to 3 redirects with 10s timeouts) plus DNS resolution, with only a 15-minute robots.txt cache and no de-duplication of page fetches. Because any web page in the operator's browser can POST arbitrary URLs to 127.0.0.1 with no credentials, this is a real CSRF-driven DoS / outbound-request amplification primitive and a force-multiplier for the F1 SSRF. The project context explicitly says missing CSRF may be flagged when combined with remote reachability, which is exactly the case here. MEDIUM is appropriate for an abuse/DoS vector on a local single-user tool.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-08-11)

## Resolution

Confirmed true-positive on the amplification path: with no auth layer, the only thing
stopping a malicious web page from repeatedly POSTing arbitrary URLs to this endpoint was
the absence of any Origin/CSRF check. Added `proxy.ts` (project root) — Next.js 16's
renamed `middleware.ts` — matching `/api/:path*`, which rejects any request whose `Origin`
(or `Referer`, when `Origin` is absent) header names a different host than the one the
request actually arrived on, returning 403. This removes the actual attack vector described
(any web page in the operator's browser) without requiring per-route changes.

Deliberately did *not* add per-host rate limiting / a concurrency cap on outbound fetches:
once cross-origin requests are rejected, the only remaining caller is the app's own
same-origin frontend, and throttling that would just make the tool itself slower for no
security benefit in this single-user local app. This is the same fix as the four
`expensive-api-abuse` findings (same root cause) — see those files' Resolution sections.

Verified: `bun test tests/unit/proxy.test.ts`, `bun tsc`, `bun lint`, plus a live `next dev`
smoke test — same-origin/no-Origin POST to `/api/tools/ai-crawl-checker` returns 200,
cross-origin `Origin: http://evil.example` returns 403.
