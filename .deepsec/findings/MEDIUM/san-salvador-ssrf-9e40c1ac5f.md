# [MEDIUM] DNS-rebinding TOCTOU: hostname is resolved for the SSRF check but re-resolved by fetch() without IP pinning

**File:** [`libs/utils/urlAnalysis.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/libs/utils/urlAnalysis.ts#L109-L161) (lines 109, 116, 142, 155, 161)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** high  •  **Slug:** `ssrf`

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

getUrlHtml() calls assertPublicHostname(currentUrl.hostname), which uses dns.resolve4/resolve6 to verify that every resolved IP is public, and then immediately calls `fetch(currentUrl.href, ...)` using the hostname (not the resolved IP). undici performs its own DNS resolution at connect time, so between the check and the connection an attacker-controlled authoritative server can change the answer (classic DNS rebinding). A user-supplied competitor URL whose DNS first returns a public IP and then returns 127.0.0.1 / 169.254.169.254 / an RFC1918 address will pass the guard and then be fetched to an internal target. The sibling module libs/aiCrawlChecker.ts at least documents IP-pinning intent (though its comment is also aspirational); urlAnalysis.ts has none. The project threat model explicitly calls this out as a known gap to flag. Because the product is loopback-only single-user, impact is bounded to internal/LAN/metadata services on the operator's host, hence MEDIUM rather than HIGH.

## Recommendation

Pin the connection to the resolved IP: resolve once, validate, then fetch using the literal IP (with the original Host header) or use an undici Agent with a custom connect hook that refuses any address not matching the previously-validated set. Apply the same pinning on every redirect hop.

## Revalidation

**Verdict:** true-positive

Verified in libs/utils/urlAnalysis.ts. getUrlHtml calls assertPublicHostname(currentUrl.hostname), which uses dns.resolve4/resolve6 to fetch all addresses and rejects any matching isPrivateIP, then immediately calls fetch(currentUrl.href, ...) with the hostname. The customDispatcher created at the top of the module only configures connectTimeout/headersTimeout/bodyTimeout/maxHeaderSize — it does not pin a remote IP. undici performs its own DNS resolution at connect time, so between the assertPublicHostname check and the actual TCP connection an attacker-controlled authoritative server can change the answer (classic DNS rebinding). The /api/new-project/domain-metadata route is an unauthenticated GET that passes req.nextUrl.searchParams 'url' straight into getDomainMetadata → getUrlHtml, so a web page in the operator's browser can trivially drive it (GET is even easier to CSRF than POST). Redirects re-run assertPublicHostname but re-fetch by hostname, reopening the window each hop. MEDIUM is appropriate given the loopback-only single-user bounding.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-08-11)
