# [MEDIUM] SSRF via DNS-rebinding window in getDomainMetadata (TOCTOU)

**File:** [`app/api/new-project/competitors/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/new-project/competitors/route.ts#L25-L28) (lines 25, 28)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `ssrf`

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

This GET handler calls getDomainMetadata(competitor.url) for each competitor returned by the Google AI model. competitor.url is not directly user-supplied, but it is AI-generated from user-controlled `url`/`name`/`categories` query params (the AI uses google_search/url_context tools), so a CSRF-driven caller can steer the model toward returning an attacker-chosen hostname. getDomainMetadata -> getUrlHtml (libs/utils/urlAnalysis.ts) resolves the hostname via assertPublicHostname and rejects private IPs, but then calls `fetch(currentUrl.href, ...)` by *hostname* rather than pinning the resolved IP. There is a classic TOCTOU/DNS-rebinding window: the hostname can resolve to a public IP during the check and to 127.0.0.1/169.254.169.254/10.x during the subsequent fetch, bypassing the private-IP block. Combined with the absence of any auth/Origin/CSRF check on this loopback server (by design), any local web page can drive this server-side fetch. The redirect loop also re-resolves via assertPublicHostname per hop (good) but still fetches by hostname each time, so the rebinding window exists on every hop.

## Recommendation

After resolving and validating the IP in assertPublicHostname, pin the fetch to that IP (e.g. connect to the resolved IP with a Host header, or use a custom undici Agent/connect option that locks the socket to the validated address), and re-validate on redirect hops. Alternatively resolve once and fetch via the IP literal with the original Host header.

## Revalidation

**Verdict:** true-positive

In app/api/new-project/competitors/route.ts, competitor.url comes from getCompetitors' AI output (verified in libs/ai/competitors/getCompetitors.ts: the research generateText uses google_search/url_context tools fed by attacker-controlled url/name/categories query params), and is then passed to getDomainMetadata for every competitor. getDomainMetadata -> getUrlHtml (libs/utils/urlAnalysis.ts) calls assertPublicHostname(currentUrl.hostname) which resolves DNS via resolve4/resolve6 and rejects private IPs, but the subsequent fetch(currentUrl.href, ...) re-resolves the hostname independently via undici — a classic TOCTOU/DNS-rebinding window. An attacker-controlled domain can return a public IP at check time and 127.0.0.1/169.254.169.254 at fetch time, bypassing the private-IP block. The redirect loop re-runs assertPublicHostname per hop but still fetches by hostname, so the gap persists on every hop. The server is loopback-only with no auth/Origin/CSRF enforcement by design, and the threat model explicitly acknowledges this rebinding gap, so it is a real, exploitable SSRF surface. MEDIUM is appropriate.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-07-30)
