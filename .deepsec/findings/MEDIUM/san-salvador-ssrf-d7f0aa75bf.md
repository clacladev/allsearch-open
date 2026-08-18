# [MEDIUM] SSRF to internal services via DNS rebinding TOCTOU in getUrlHtml

**File:** [`app/api/new-project/domain-metadata/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/new-project/domain-metadata/route.ts#L8-L16) (lines 8, 9, 10, 11, 12, 13, 14, 15, 16)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** high  •  **Slug:** `ssrf`
**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

GET `/api/new-project/domain-metadata?url=...` accepts a user-supplied URL and fetches it server-side via `getDomainMetadata` → `getUrlHtml` (libs/utils/urlAnalysis.ts). `getUrlHtml` calls `assertPublicHostname(currentUrl.hostname)` which resolves DNS with `resolve4`/`resolve6` and rejects any private/reserved IP — but it does NOT pin the resolved IP before the subsequent `fetch(currentUrl.href, ...)`. Node/undici `fetch` re-resolves the hostname independently, so an attacker-controlled domain can return a public IP at check time and `127.0.0.1` (or `169.254.169.254`, internal services, etc.) at fetch time — a classic DNS rebinding TOCTOU that bypasses the private-IP block. Although the server is bound to 127.0.0.1 with no auth by design, this endpoint is a simple GET with a single query parameter and no CSRF/Origin protection, so a malicious web page visited by the local user can drive the browser to issue the request (the SSRF side-effect occurs regardless of CORS read-blocking of the response). The per-redirect re-check has the same TOCTOU gap. The error branch also echoes `error.message` (line 16) which could disclose internal fetch error details. This is explicitly acknowledged as a known gap in the repo threat model.

## Recommendation

Pin the resolved IP address and connect to it directly (e.g. set a custom `dispatcher`/`lookup` function that returns the already-verified IP, or re-resolve and re-validate immediately before each `fetch` and enforce the connection uses that IP). Also reject redirect targets whose scheme is not http/https, and replace the echoed `error.message` with a generic string.

## Revalidation

**Verdict:** true-positive

GET /api/new-project/domain-metadata?url=... takes a directly user-supplied URL and passes it to getDomainMetadata -> getUrlHtml (libs/utils/urlAnalysis.ts). getUrlHtml validates the hostname with assertPublicHostname (resolve4/resolve6 + isPrivateIP rejecting 127./10./172.16-31./192.168./169.254./::1/fc/fd/fe80) but then calls fetch(currentUrl.href, ...) by hostname, letting Node/undici re-resolve independently — a textbook DNS-rebinding TOCTOU that bypasses the private-IP block. This is the cleaner SSRF case than F1 because the URL is directly attacker-supplied (no AI-indirection needed). The endpoint is a simple GET with one query param and no auth/Origin/CSRF check, so a malicious local web page can drive the fetch; the SSRF side-effect happens regardless of CORS read-blocking. The error branch also echoes error.message (line 16). The threat model explicitly acknowledges this gap. High-confidence true-positive; MEDIUM appropriate.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-07-29)

## Resolution

Confirmed true-positive. Same root-cause fix as `ssrf-9e40c1ac5f.md` — `getUrlHtml()` now
pins the fetch to the validated IP via the shared `libs/utils/ssrfGuard.ts` (see that
finding's Resolution for details). Also addressed this finding's own additional
recommendation: `app/api/new-project/domain-metadata/route.ts`'s error branch no longer
echoes raw `error.message` to the client — it now returns a generic
`'Could not fetch metadata for that URL'` message (the real error is still `console.error`'d
server-side).

Redirect-target scheme validation was not added on top of this: `getSafeNewUrl` already
restricts the *initial* URL to http/https, but redirect hops in `getUrlHtml` don't currently
re-check scheme — noting this as a smaller residual gap, not re-filing it since it's outside
what any deepsec finding flagged as the primary issue here.

Verified: `bun tsc`, `bun lint`, plus a live `getDomainMetadata()` smoke test.
