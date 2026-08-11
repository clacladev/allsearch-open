# 25 — Gemini grounding is not guaranteed

Status: ready-for-agent
Milestone: 3 — Collection engine
Blocked by: 10

`gemini-3.1-flash-lite` decides for itself whether to search, and often does not.
When it does not, it answers from training data and the Prompt Response is
worthless — but it is long, fluent and indistinguishable from a grounded one.

Measured on 2026-07-29 with `bun run verify:providers`, same model and same
prompt three times:

| Run | Text length | Cited Sources |
|---|---|---|
| 1 | 3448 | 0 |
| 2 | 3275 | 13 |
| 3 | 3345 | 0 |

When grounding fires, the Sources are real `vertexaisearch` grounding URLs, so
`response.sources` parsing is correct. A zero means the model never searched.

**This is not a regression from issue 07.** The gateway called the same model
with the same tool and no way to force it, so this has been happening all along;
the SaaS simply had nothing that checked. It is likely also true of the daily
data the SaaS collected.

**There is no flag to force it.** Unlike OpenAI, where `toolChoice` forces
`web_search`, `@ai-sdk/google@3`'s `googleSearch` tool accepts only `searchTypes`
and `timeRangeFilter`. Dynamic retrieval — where a threshold controlled the
decision — was a Gemini 1.5 feature and is gone. The comment in
`getPromptResponseWithGoogleAIMode.ts` claiming grounded retrieval is
"effectively always-on for Gemini 2.0+/3.x" was wrong and has been corrected.

**It is detectable**, which is what makes this fixable:
`providerMetadata.google.groundingMetadata.webSearchQueries` lists the searches
the model actually ran. Empty means it answered from training data.

Why it matters: Visibility is the percentage of Prompt Responses mentioning a
Brand. An ungrounded response still mentions brands — whichever ones the model
remembers — so it does not merely add noise, it biases the headline metric
towards whatever was popular in the training data. A brand that has since
declined keeps scoring well, and a brand newer than the cutoff cannot appear at
all.

## Approach

Treat an ungrounded response as a failure, not as data. Issue 10 gives every
(Prompt × Chatbot) pair a `collection_run_items` row that can be marked failed
and retried, which is exactly the shape this needs: detect the empty
`webSearchQueries`, do not store the response, mark the item retryable.

Worth measuring before settling on retry-forever: whether `gemini-3-flash`
grounds more reliably than the lite model. The grounding fee dominates the bill
either way ($14 per 1000 searches against a $0.25/$1.50 per 1M token rate), so
the cost difference between the two models is smaller than it looks.

Retries cost real money on the user's own key, so cap them and surface the
partial result honestly rather than looping.

## Done when

- An ungrounded Gemini response is never stored as a Prompt Response.
- A Collection Run that hits this reports the affected items as failed and
  retryable, not as complete.
- The retry cap is bounded and the user can see how many items were dropped.

## Comments

**Implemented.**

- **Detection** is `libs/ai/grounding.ts`: `getWebSearchQueries()` reads
  `providerMetadata.google.groundingMetadata.webSearchQueries`, and
  `assertResponseIsGrounded()` throws `UngroundedResponseError` when it is empty.
  Google omits the key entirely rather than sending `[]` when the model did not
  search, and has been seen sending a null `groundingMetadata`, so all three
  shapes are treated as "never searched".

- **The check runs inside `getPromptResponseWithGoogleAIMode`**, not at the call
  site, so it covers `bun run verify:providers` as well as the Collection Run and
  cannot be forgotten by a future caller. Throwing (rather than returning a
  response the caller must remember to inspect) is what routes it into the
  existing failure path: `executePrompt` only persists the completed subset, so
  an ungrounded answer never reaches `insertPromptResponseRows`.

  That function also had to start awaiting `generateText` instead of returning
  its promise. Its `try`/`catch` was dead code before — an async rejection
  escaped a `try` that returned a promise, so the `NoObjectGeneratedError`
  logging branch could never fire.

- **The retry cap is `MAX_ITEM_ATTEMPTS` (3)**, the item budget that already
  existed, rather than a second knob. `callAiWithRetry` retries an ungrounded
  response with *no* provider cooldown and *no* backoff, unlike a 429: the
  provider is answering fine, so cooling Google down would stall every other
  Google item behind a healthy API, and waiting does not change the model's next
  decision. An item that exhausts the budget ends `failed`, which the existing
  retry endpoint already reopens.

- **Visibility of what was dropped**: the run summary already reported
  `N failed`, but not why. `CollectionRunItemProgressRow` now carries the item's
  `error` (only for `failed` items — a stale message on a row that later
  succeeded must not show), and the progress UI renders it as the failed badge's
  tooltip. That distinguishes "Gemini answered without searching" from a rate
  limit or a missing key, which ADR 0007 already says every AI-dependent screen
  must handle.

- **`gemini-3-flash` was not evaluated**, so the model was left at
  `gemini-3.1-flash-lite`. The comparison the issue suggests needs repeated live
  calls on a real key, which this change cannot do; `verify:providers` now prints
  the search-query count on a grounded Google run so the measurement is a matter
  of running it a few times per model. Swapping the model on an untested hunch
  would have been the worse call given the grounding fee dominates either way.

- **Verified**: `bun lint`, `bun tsc`, `bun test` (632 pass / 0 fail) and the
  `chromium-no-auth` Playwright project (the Collection Run progress spec, which
  covers the badge markup that changed).
