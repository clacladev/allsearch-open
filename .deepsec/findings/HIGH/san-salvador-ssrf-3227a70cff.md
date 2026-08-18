# [HIGH] DNS-rebinding TOCTOU in checkAICrawlability bypasses the SSRF blocklist

**File:** [`app/api/tools/ai-crawl-checker/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/tools/ai-crawl-checker/route.ts#L13-L16) (lines 13, 16)
**Project:** san-salvador
**Severity:** HIGH  •  **Confidence:** medium  •  **Slug:** `ssrf`
**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

The route calls checkAICrawlability(body.url), which in libs/aiCrawlChecker.ts calls assertSafeHost(hostname) to resolve the hostname via dns.lookup({all:true}) and reject private/blocked IPs. However, the actual network call is performed by fetchRobots()/fetchPage(), which invoke fetch(currentUrl, ...) using the original hostname URL string. No custom agent/dispatcher pins the TCP connection to the previously-validated IP address, so Node/Bun re-resolves the hostname through the system resolver at fetch time. The comment in assertSafeHost ('we resolve here and then pass the resolved IP to fetch; the connector uses it directly') is not reflected in the code — the resolved IP is never passed to fetch. This is a classic TOCTOU DNS-rebinding window: an attacker-controlled authoritative DNS server can return a public IP for the assertSafeHost lookup and a private IP (127.0.0.0/8, 169.254.169.254, 10.x, 192.168.x, etc.) for the subsequent fetch. Because the product is a loopback-only single-user server with no auth, sessions, CSRF tokens, or Origin enforcement (documented in cli/runtime.ts), any web page in the operator's browser can POST to this endpoint and drive the local server to fetch internal addresses. The JSON response leaks partial response metadata back to the caller (status, redirectChain, htmlBytes, visibleTextLength, detectedFrameworks, jsonLd types, og/twitter counts), enabling internal port scanning and service fingerprinting. Redirect handling re-validates each hop via assertSafeHost but still fetches by hostname, so the rebinding window reopens on every redirect.

## Recommendation

Pin the connection to the validated IP. After resolving and validating addresses in assertSafeHost, fetch using the resolved IP (e.g. rewrite the URL host to the literal IP and set a Host header, or use a custom undici agent/dispatcher with a connect option that restricts the remote IP to the validated set). Re-validate on every redirect the same way. Alternatively, perform a single resolution and reuse the resulting socket/IP for the entire request, rejecting any second resolution that disagrees. Also consider adding Origin/CSRF protection on this POST route given the documented lack of auth.

## Revalidation

**Verdict:** true-positive

Verified in app/api/tools/ai-crawl-checker/route.ts and libs/aiCrawlChecker.ts. The route POSTs body.url into checkAICrawlability, whose assertSafeHost (L224-248) resolves the hostname via dns.lookup({all:true}) and rejects blocked ranges via isBlockedIPv4/isBlockedIPv6, but fetchRobots (L289) and fetchPage (L329) then call fetch(currentUrl, ...) using the original hostname string. No custom undici agent/lookup pins the TCP connection to the validated IP, so the runtime re-resolves at connect time. The inline comment at L238-240 claiming the resolved IP is passed to fetch is aspirational — it is never passed. This is a genuine TOCTOU DNS-rebinding window: an attacker-controlled authoritative server returns a public IP for the assertSafeHost lookup and 127.0.0.1/169.254.169.254/RFC1918 for the fetch-time lookup. Each redirect hop re-validates via assertSafeHost but re-fetches by hostname, reopening the window. The endpoint is an unauthenticated POST on the loopback-only server with no Origin/CSRF enforcement (documented in cli/runtime.ts), so any web page in the operator's browser can drive it, and the JSON response leaks status, redirectChain, htmlBytes, visibleTextLength, detectedFrameworks, jsonLd types, and og/twitter counts — enabling internal port scanning and service fingerprinting. HIGH is justified by the combination of remote-reachable CSRF trigger, reach of loopback/internal/metadata services, and response metadata exfiltration.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-08-11)

## Resolution

Confirmed true-positive. Fixed in `libs/aiCrawlChecker.ts`: `assertSafeHost()` now returns
the validated addresses, and `fetchRobots`/`fetchPage` rewrite the actual fetch URL to the
validated IP literal (`pinRequestUrl`) instead of the hostname, sending the original
hostname via the `Host` header and (for HTTPS) `tls.serverName` for SNI/cert validation.
This closes the rebinding window by construction — there is no second DNS lookup at
connect time — re-validated on every redirect hop.

Note: an initial attempt used an `undici` `Agent` with a custom `connect.lookup`, following
the pattern used elsewhere in this codebase (`libs/utils/urlAnalysis.ts`). That approach is
silently ignored by Bun's `fetch()` (verified empirically — a deliberately-failing custom
lookup was never invoked, and `Agent.destroy()` doesn't even exist on Bun's `undici` shim)
which runs this app's production server per `cli/runtime.ts`. The IP-literal-rewrite
approach was used instead and confirmed to work against real HTTP/HTTPS traffic including
multi-hop redirects. **This means the identical `connect.lookup` pattern already in
`libs/utils/urlAnalysis.ts` (tracked separately) is not just a design choice but is
non-functional as SSRF protection under Bun — flagged for that finding's fix too.**

Verified: `bun test tests/unit/aiCrawlChecker.test.ts`, `bun tsc`, `bun lint`, plus live
`checkAICrawlability('https://example.com')` and `checkAICrawlability('http://github.com')`
(redirect chain) both succeeding end-to-end.
