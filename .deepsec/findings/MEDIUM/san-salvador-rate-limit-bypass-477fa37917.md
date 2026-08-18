# [MEDIUM] Outbound-fetch tool endpoint has no rate limiting or abuse protection

**File:** [`app/api/tools/ai-crawl-checker/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/tools/ai-crawl-checker/route.ts#L12-L16) (lines 12, 13, 16)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `rate-limit-bypass`

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
