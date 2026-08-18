# [BUG] Raw upstream error.message echoed to client on non-401/403/429 failures

**File:** [`app/api/new-project/competitors/route.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/api/new-project/competitors/route.ts#L44-L52) (lines 44, 51, 52)
**Project:** san-salvador
**Severity:** BUG  •  **Confidence:** low  •  **Slug:** `other-info-disclosure`

**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

In the catch block, toAiError only classifies 401/403/429 (and quota/rate-limit text). Any other APICallError (e.g. 400 Bad Request, 500) falls through to `NextResponse.json({ error: error instanceof Error ? error.message : error }, { status: 500 })`. APICallError.message from @ai-sdk/provider typically embeds the upstream HTTP response body. While provider API keys are sent as headers (not echoed in bodies), the leaked message can still disclose upstream response details, request echo, or provider-side diagnostics to a cross-origin caller. This matches the repo's own flagged pattern of routes echoing error.message that may carry upstream provider text.

## Recommendation

Replace the generic `error.message` fallback with a fixed generic string (as the article route does: 'Internal server error') and log the full error server-side only. Only return structured, allowlisted error codes/messages to the client.

## Revalidation

**Verdict:** true-positive

In the catch block of competitors/route.ts, toAiError (libs/ai/errors.ts) only classifies 401/403/429 and quota/rate-limit text; any other APICallError (400/500/etc.) falls through to NextResponse.json({ error: error.message }, { status: 500 }). APICallError.message from @ai-sdk/provider embeds the upstream HTTP response body, so this leaks provider-side diagnostics/response text to a cross-origin caller — matching the repo's own flagged error-echo pattern. However, provider keys are sent as request headers (not echoed in response bodies), and the bound parameters (url/name/categories) are already attacker-controlled via the query string, so the realistic disclosure value is limited to upstream diagnostics rather than credentials. Real but low-impact; adjusting severity to BUG.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-07-30)
