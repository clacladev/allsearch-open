# [MEDIUM] isPrivateIP misses IPv4-mapped IPv6 and several reserved ranges, enabling metadata-service / internal SSRF bypass

**File:** [`libs/utils/urlAnalysis.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/libs/utils/urlAnalysis.ts#L109-L127) (lines 109, 116, 121, 122, 123, 124, 125, 126, 127)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `ssrf`

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

isPrivateIP() handles IPv4 private ranges and a small set of IPv6 literals (::1, ::, fc00::/7, fe80::/10) but does NOT handle IPv4-mapped IPv6 addresses. A DNS AAAA record returning `::ffff:169.254.169.254` (or `::ffff:127.0.0.1`, `::ffff:10.0.0.1`) passes isPrivateIP() because it doesn't match `::1`, `::`, `^f[cd]`, or `^fe80`. undici will connect to that IPv6 address, which on dual-stack hosts maps to the corresponding IPv4 target — bypassing the metadata/cloud-internal block. The same function also omits 100.64.0.0/10 (CGNAT, used by some internal networks), 192.0.0.0/24, 198.18.0.0/15, 224.0.0.0/4, 240.0.0.0/4, and does not block well-known metadata hostnames like `metadata.google.internal` (only the literal string `localhost`/`[::1]` is blocked). Compare with libs/aiCrawlChecker.ts:isBlockedIPv4/isBlockedIPv6 which correctly covers all of these including the `::ffff:` extraction. The inconsistency means the new-project/domain-metadata SSRF surface is protected by the weaker of the two guards.

## Recommendation

Reuse libs/aiCrawlChecker.ts's isBlockedIPv4/isBlockedIPv6/isBlockedHost (or factor them into a shared ssf-guard module) instead of the local isPrivateIP, so both fetch paths share the same coverage, including IPv4-mapped IPv6 extraction and the metadata hostname blocklist.

## Revalidation

**Verdict:** true-positive

Verified by direct comparison of libs/utils/urlAnalysis.ts:isPrivateIP (L109-127) against libs/aiCrawlChecker.ts:isBlockedIPv6. isPrivateIP checks only 127/10/172.16-31/192.168/169.254/0/255.255.255.255 for IPv4, and ::1, ::, ^f[cd], ^fe80 for IPv6. It omits IPv4-mapped IPv6 entirely: an AAAA record returning ::ffff:169.254.169.254 (or ::ffff:127.0.0.1, ::ffff:10.0.0.1) does not match ::1, ::, ^f[cd], or ^fe80, so it passes the guard, and on dual-stack hosts undici connects via the mapped address to the corresponding IPv4 internal/metadata target. It also omits 100.64.0.0/10 (CGNAT), 192.0.0.0/24, 198.18.0.0/15, 224.0.0.0/4, 240.0.0.0/4, and well-known metadata hostnames (only literal 'localhost'/'[::1]' are blocked). The sibling isBlockedIPv4/isBlockedIPv6 in aiCrawlChecker.ts correctly cover all of these, including the ::ffff: extraction, confirming the inconsistency is real and that the new-project/domain-metadata SSRF surface is protected by the weaker guard. The recommended fix (reuse aiCrawlChecker's helpers from a shared module) is sound. MEDIUM is appropriate.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-08-11)
