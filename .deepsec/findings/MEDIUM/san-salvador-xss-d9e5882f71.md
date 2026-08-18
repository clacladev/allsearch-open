# [MEDIUM] Unvalidated source URL rendered as anchor href (potential javascript: URL XSS)

**File:** [`app/(private)/project/[projectId]/sources/[sourceId]/components/SourceDetails.tsx`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/(private)/project/[projectId]/sources/[sourceId]/components/SourceDetails.tsx#L33-L45) (lines 33, 37, 45)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** low  •  **Slug:** `xss`

**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

In SourceHeader, `<a href={source.url} target="_blank" rel="noopener noreferrer nofollow">` renders the raw `source.url` directly into an href attribute. React does not strip `javascript:` (or `data:`) schemes from href values, so a non-http(s) URL stored in the sources table would execute as XSS when the single user clicks the link. The `cleanUrl` field is sanitized via `getSafeNewUrl` (libs/utils/urls.ts prepends `https://` and runs `new URL()`, throwing on invalid schemes), but the `url` field rendered here is NOT. The `url` value originates in `getSourcesFromResponse` (libs/ai/responseSources.ts:13,31) as the raw, unvalidated URL returned by the AI chatbot provider, and in `analyseSources` (libs/collection/analyseSources.ts:19-30) the catch block preserves the original `source` unchanged when `getUrlAnalysis` throws — so a `javascript:` URL that fails resolution would be persisted and later rendered. Exploitability is gated on a chatbot provider surfacing a non-http(s) citation URL (low probability, possibly via prompt-injected scraped content), which is why this is medium/low rather than high. Evidence: SourceDetails.tsx:33-45 (anchor), getSourceContentSummary.ts:31 (`url: data.url`), responseSources.ts:13/31 (`url: source.url`), analyseSources.ts:30 (`return source` in catch).

## Recommendation

Before rendering, validate `source.url` is an http(s) URL (e.g. via `isValidUrl`/`getSafeNewUrl` from libs/utils/urls.ts) and fall back to `source.cleanUrl` or omit the href otherwise. Alternatively, normalize/sanitize `url` at write time in `getSourcesFromResponse`/`analyseSources` so only http(s) URLs are persisted to the sources table.

## Revalidation

**Verdict:** uncertain

The code pattern is real and confirmed: SourceDetails.tsx:37 renders source.url raw into <a href> with no scheme validation, while only cleanUrl is sanitized via getSafeNewUrl. I verified the bypass: getSafeNewUrl('javascript:alert(1)') throws (https://javascript:alert(1) has invalid port), but getSafeNewUrl('javascript://example.com/%0aalert(1)') parses successfully (host='javascript', empty port), so that exotic form survives getUrlCleanComponents, is preserved unchanged by the analyseSources catch block, persisted to sources.url, and later rendered as a clickable javascript: href that executes on click. So the rendering-side flaw and the sanitizer bypass are both real. What I cannot verify from source is whether a javascript-scheme URL can ever enter the DB: citation URLs originate from the AI providers' response.sources / web_search output.sources, which come from the providers' web-search results (http/https URLs), not from freely model-generated text or from the scraped HTML used for article generation. The threat model's prompt-injection vector applies to article-generation context, not to provider citation URLs. If any provider ever surfaced a javascript://...%0a... URL the chain would be exploitable, but I cannot confirm that path exists, so the verdict is uncertain rather than true-positive. Recommendation to validate http(s) on render or at write time is sound defense-in-depth regardless.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-08-14)
