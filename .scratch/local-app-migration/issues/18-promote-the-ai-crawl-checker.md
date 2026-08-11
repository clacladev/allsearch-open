# 18 — Promote the AI crawl checker into the dashboard

Status: ready-for-human
Milestone: 6 — Feature moves
Blocked by: 17

`libs/aiCrawlChecker.ts` is around 500 lines that check whether GPTBot,
ClaudeBot and PerplexityBot can actually reach a site: robots.txt rules, redirect
chains, rendering, structured data. In the SaaS it was a public lead magnet at
`/ai-crawl-checker`, which is why it is being deleted as a marketing page.

It should not be deleted as a feature. As a per-Project diagnostic it is arguably
the most actionable thing in the product — *"your visibility is zero because you
block GPTBot in robots.txt"* is a more useful finding than anything the
Opportunities list can produce, and unlike everything else here it costs nothing
to run and needs no API key.

Move it to a Project-scoped health view, run against `projects.url`. Reuse the
existing checks and result rendering from the public page before deleting that
page.

**Drop the in-memory per-IP rate limiter** in
`app/api/tools/ai-crawl-checker/route.ts` — 10 requests per minute keyed on
`x-forwarded-for` is meaningless when the only caller is the person running the
app.

**Keep `assertSafeHost` and the SSRF protections.** They matter *more* locally,
not less: the app now makes outbound requests from inside the user's own home or
office network, so a redirect to an internal address is a real hazard rather than
a theoretical one. The same applies to `assertPublicHostname` in
`libs/utils/urlAnalysis.ts`, which is reached with AI-supplied URLs.

Consider surfacing a failed bot check on the overview, since a blocked crawler
explains an otherwise inexplicable zero.

## Done when

- The check runs from a Project and reports per-bot access.
- `tests/unit/aiCrawlChecker.test.ts` still passes.
- The public route and page are gone; SSRF guards remain.


## Comments

- Implemented: project Crawl health page, rate limit removed, e2e public page spec deleted.
