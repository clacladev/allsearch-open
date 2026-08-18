# [BUG] Stateful global regex makes highlight matching non-deterministic in highlightChildren

**File:** [`app/(private)/project/[projectId]/prompts/[promptId]/components/PromptResponseDetailModal.tsx`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/app/(private)/project/[projectId]/prompts/[promptId]/components/PromptResponseDetailModal.tsx#L65-L68) (lines 65, 66, 67, 68)
**Project:** san-salvador
**Severity:** BUG  •  **Confidence:** high  •  **Slug:** `other-logic-bug`

**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

In `highlightChildren`, a regex is constructed with the global flag: `const regex = new RegExp(`(${pattern})`, 'gi');`. The string is then split with `child.split(regex)` (which, for a capturing-group regex, interleaves the matched substrings into the result array), and each part is classified with `regex.test(part)` inside `.map(...)`. Because `regex` has the `g` flag, `RegExp.prototype.test` is stateful: each call advances `regex.lastIndex` and the next `test` starts scanning from that index against a *different* string. After `split`, `lastIndex` is reset to 0, but the subsequent `.map` calls mutate it across parts, so whether a given part is wrapped in `<mark>` depends on the residual `lastIndex` from the previous part rather than on whether the part actually matches. The result is inconsistent/missing brand-name highlighting in the prompt-response modal (some matched substrings render unstyled, and in edge cases a non-matching part could be mis-classified). This is purely a rendering defect, not exploitable. Note also that `split` already returns the captured matches at known (odd) indices, so `regex.test` is unnecessary entirely.

## Recommendation

Either drop the `g` flag for the `test` calls (create a separate non-global regex for testing, e.g. `new RegExp(pattern, 'i')`), or — preferably — rely on the fact that `String.prototype.split` with a capturing group already places captured matches at odd indices, and wrap those indices in `<mark>` without re-testing. Recreating the regex per child also has a small perf cost; hoist it once per `MarkdownResponseText` render.

## Revalidation

**Verdict:** true-positive

In highlightChildren a single `new RegExp((${pattern}), 'gi')` is used both to split the string and to test each resulting part. Because the `g` flag makes RegExp.prototype.test stateful, each successful test advances regex.lastIndex; the next part is then scanned from that offset against a different (typically shorter) substring, so a captured-match part can test false and fail to be wrapped in <mark>, producing inconsistent/missing brand highlighting. String.prototype.split with a capturing group already places the captured matches at known odd indices, so the regex.test call is both buggy and unnecessary, exactly as described. This is a confirmed, reproducible rendering logic defect (non-deterministic highlighting depending on residual lastIndex across parts). It is not security-exploitable, which matches the finding's own BUG severity and 'purely a rendering defect' characterization.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-08-14)
