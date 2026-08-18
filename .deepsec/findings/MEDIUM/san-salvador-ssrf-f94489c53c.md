# [MEDIUM] DNS-rebinding TOCTOU: SSRF blocklist is checked but the resolved IP is not pinned before fetch()

**File:** [`libs/aiCrawlChecker.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/libs/aiCrawlChecker.ts#L224-L329) (lines 224, 238, 240, 289, 329)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** high  •  **Slug:** `ssrf`

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

assertSafeHost() (L224-248) resolves the hostname via dns.lookup({all:true}) and rejects any address falling in a private/loopback/metadata range. However, the subsequent fetch() calls in fetchRobots (L289) and fetchPage (L329) are invoked with `currentUrl` containing the original *hostname*, not the validated IP address. No custom lookup/dns lookup option is passed to fetch() to force it to reuse the already-validated address, so the runtime re-resolves the hostname a second time. An attacker who controls DNS for a domain the user asks the tool to check can answer the first lookup (the one assertSafeHost performs) with a public IP that passes the blocklist, then answer the second lookup (the one fetch() performs) with 127.0.0.1, 169.254.169.254, or an RFC1918 address, reaching internal/metadata services. The inline comment at L238-240 ('DNS rebinding mitigation: we resolve here and then pass the resolved IP to fetch; the connector uses it directly') is misleading — the resolved IP is never passed to fetch; only the hostname is. This tool fetches arbitrary user-supplied URLs (competitor sites during AI-crawlability checks), so a malicious competitor page/domain is a realistic vector. Impact is amplified by the loopback-only, no-auth threat model: any internal HTTP service on the host (including the AllSearch server itself on 127.0.0.1:port) becomes reachable server-side. Redirects are re-validated via assertSafeHost on each hop (good), but the same rebinding window applies on every hop.

## Recommendation

Pin the resolved IP for the actual fetch: either (a) rewrite the fetch URL to use the validated literal IP (preserving SNI/Host headers for HTTPS via a custom Host header / SNI option), or (b) pass a custom `lookup` function to fetch/undici that returns the already-validated address without re-querying DNS, or (c) use undici's `connect: { lookup }` option to force the connector to use the pinned address. Re-resolving must be prevented entirely, not just re-checked, because the validation and the fetch are two separate DNS queries.

## Revalidation

**Verdict:** true-positive

Verified directly in libs/aiCrawlChecker.ts. assertSafeHost (L224-248) resolves the hostname via dns.lookup({all:true}) and validates every address against isBlockedIPv4/isBlockedIPv6 (which correctly cover RFC1918, loopback, link-local, CGNAT, 192.0.0/24, 198.18/15, multicast, reserved, IPv4-mapped IPv6, ULA, and metadata hostnames). However, the subsequent fetch calls in fetchRobots (L289) and fetchPage (L329) use currentUrl containing the original hostname, not the validated IP — no custom undici agent, no connect hook, no lookup override pins the connection. The comment at L238-240 ('we resolve here and then pass the resolved IP to fetch; the connector uses it directly') is contradicted by the actual code: the resolved addresses are used only for the blocklist check and discarded. undici re-resolves the hostname at connect time, opening a TOCTOU DNS-rebinding window. An attacker controlling DNS for the checked domain can return a public IP for assertSafeHost's lookup and 127.0.0.1/169.254.169.254/RFC1918 for fetch's lookup. Redirects re-run assertSafeHost but still fetch by hostname, so the window reopens each hop. This is the same root cause as F1 but located in the library file rather than the route; per the duplicate rules, cross-file is not a duplicate. MEDIUM is appropriate since this finding focuses on the rebinding mechanism itself without the CSRF/metadata-leak amplification emphasized in F1.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-07-29)
