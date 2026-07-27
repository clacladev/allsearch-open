# 03 — Green the portable unit tests

Status: ready-for-agent
Milestone: 0 — Import and safety net
Blocked by: 02

This is the safety net for the whole migration (ADR 0008). These tests must be
green now, and stay green through the database and provider swaps. If
`tests/unit/project-analysis/` still passes after Milestone 1, the analysis layer
survived.

**Port unchanged** — pure functions over row arrays and offline fixtures:

- `tests/unit/project-analysis/` — 7 files: `getVisibilityScore`,
  `getRankingsSummary`, `getOpportunitiesSummary`, `getSourceContentSummary`,
  `getSourceDomainsSummary`, `opportunityResolver`,
  `getPromptResponsesWorkRows`
- `tests/unit/urlAnalysis/` — 10 real HTML fixtures plus timeout tests
- `brandIdsRanking`, `domainUtils`, `urls`, `prompts`, `aiCrawlChecker`,
  `article-export/markdownToPdfmakeDoc`, `utils/articleOutlineDiff`,
  `utils/articleOutlineMarkdown`, `ai/articleOutlinesSchema`

**Delete** with their subjects: `api/magic-auth`, `webhook/verifyWebhookSignature`,
`opengraph`.

**Leave failing for now**, to be fixed by later issues: the 4 `tests/unit/ai/`
files (provider rewiring, issue 07) and `api/project-prompts-route` (it asserts
the 25-prompt trial cap, which no longer exists).

## Done when

- `bun test tests/unit/project-analysis tests/unit/urlAnalysis` is green.
- `bun test` reports only the known-deferred failures listed above, and they are
  named in the commit message.
