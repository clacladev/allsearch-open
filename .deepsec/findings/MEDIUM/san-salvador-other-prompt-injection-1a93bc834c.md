# [MEDIUM] Scraped competitor content and user outline injected unsanitized into article LLM prompt

**File:** [`libs/ai/promptArticles/streamArticle.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/libs/ai/promptArticles/streamArticle.ts#L37-L135) (lines 37, 39, 41, 45, 51, 112, 128, 135)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `other-prompt-injection`

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

buildUserPrompt() (L51-112) interpolates competitor-scaped fields (s.title, s.cleanUrl, s.description via renderSourceForPrompt, L41-45) and the persisted outline headings (h.text, h.keyPoint via renderOutlineForPrompt, L37-39) directly into the prompt streamed to streamText() (L128-135). The competing-source fields originate from arbitrary third-party web pages. A malicious competitor page can craft title/description text as prompt-injection directives to steer the generated article — e.g., forcing the model to emit attacker-chosen prose, insert markdown links to attacker domains, or copy misinformation verbatim into the user's draft article. The outline heading text is also influenced by the prior (already injection-exposed) outline generation, compounding the surface. No delimiter escaping, role fencing, or content sanitization is applied. The scanner's insecure-crypto flags (L29, L67) are false positives — the file contains no cryptographic operations.

## Recommendation

Wrap each competitor source block in clearly delimited, data-only containers (e.g. unique-boundary XML tags) and add a system-prompt directive to never follow instructions appearing inside source blocks. Validate generated article output: reject or strip markdown links pointing to domains outside the operator's allowlist, and flag prose that reproduces competitor heading text verbatim. Apply the same structural separation to the outline block.

## Revalidation

**Verdict:** true-positive

streamArticle.ts renderSourceForPrompt (L41-45) and renderOutlineForPrompt (L37-39) interpolate competitor-scraped fields (s.title, s.cleanUrl, s.description) and persisted outline headings (h.text, h.keyPoint) directly into buildUserPrompt (L51-112), which is streamed to streamText (L128-135) with no delimiter escaping, role fencing, or sanitization. The competitor fields originate from arbitrary third-party scraped pages; the outline heading text is itself influenced by the prior (injection-exposed) outline generation (F3), compounding the surface. A malicious page can craft title/description text to steer article prose, insert markdown links to attacker domains, or reproduce misinformation into the user's draft. This is the same vuln class as F3 but at a distinct code location in a different file (streamArticle.ts vs generateOutline.ts), so it is not a duplicate. The repo threat model explicitly acknowledges this surface. The insecure-crypto scanner flags on L29/L67 are correctly noted as false positives (no crypto in this file).

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-08-17)
