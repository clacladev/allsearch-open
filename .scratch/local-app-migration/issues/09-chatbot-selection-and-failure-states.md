# 09 — Chatbot selection and failure states

Status: ready-for-agent
Milestone: 2 — AI providers
Blocked by: 08

`SUPPORTED_CHATBOTS_IDS` in `libs/database/shared/ChatbotId.ts` is a hardcoded
constant and the collection code always runs all three. It becomes configuration
(ADR 0007).

**Selection is app-wide**, defaulting to whichever Chatbots have a key present,
and the user can turn any of them off. Each Chatbot is a third of the run's
duration and a third of the bill, so someone with all three keys may still want
Perplexity off.

**Visibility figures are only meaningful relative to the Chatbots that produced
them.** Visibility is the percentage of Prompt Responses mentioning a Brand, so
enabling a Chatbot changes the denominator. The UI must state which Chatbots a
figure covers, and must not invite comparison across periods where the enabled
set changed. This is a labelling problem, not a maths problem, but getting it
wrong makes the headline number quietly dishonest.

**Three failure states that never existed in the SaaS**, because there the key
always worked. Every AI-dependent screen needs all three:

1. **No key** — the feature is unavailable; say which key unlocks it and link to
   settings. Applies to the Chatbot columns, sentiment, and every generation
   feature.
2. **Invalid or revoked key** — distinguish from "no key"; a working key can stop
   working. Point at settings.
3. **Quota or rate limit exceeded** — the user's own account, not ours. Say so
   plainly, and for a Collection Run mark the affected items failed and retryable
   rather than failing the whole run.

Affected surfaces: onboarding topic, prompt and competitor suggestion; the
overview, prompts, sources, brands and opportunities pages; outline generation;
article streaming.

This is a small change repeated in many places, which is exactly the kind of work
that gets missed until beta. Do it as one pass with a shared component.

## Done when

- Disabling a Chatbot excludes it from the next Collection Run.
- Every metric that aggregates across Chatbots says which ones it covers.
- Revoking a key mid-session produces the right message on every affected screen,
  not a stack trace.

## Comments

**2026-07-30 — implemented alongside issue 08.**

Enablement is app-wide: the effective set is the user's stored selection
intersected with the providers that currently have a key. So adding a key
enables its Chatbot, and removing a key drops it without rewriting the
selection — re-adding the key restores the prior choice. The storage
distinguishes `null` ("never chosen", every fresh install, defaults to every
Chatbot with a key) from `[]` ("deliberately turned everything off"), which
needed the column to be nullable.

`SUPPORTED_CHATBOTS_IDS` deliberately stays the full universe for the
`filter_chatbot` dropdowns on the five list pages. Narrowing those to the
enabled set would make historical Prompt Responses from a since-disabled
Chatbot unfilterable and effectively invisible.

The three failure states share one component keyed by `AiErrorCode` +
provider, fed by a taxonomy that generalises the existing
`PromptArticleErrorCode` pattern and rides the `code` field `appFetch`
already parses. Applied to the onboarding forms, outline generation and
article streaming. The five dashboard pages were judged not to need it: they
render stored data and make no live AI call, so the honest state there is
"no data for this Chatbot", which the coverage caption already says.

Article streaming needed more than plumbing. `toTextStreamResponse()`
silently drops `'error'` stream parts, so an invalid or rate-limited key
arriving *after* the 200 headers were on the wire was invisible; it is now a
manual `ReadableStream` over `result.fullStream` with a sentinel the client
strips back out. A latent bug turned up next to it: `ArticleView` never read
`stream.status`, so the hook's error state never left streaming mode.

Two things this issue asked for are **not** done. The clause about not
inviting comparison across periods where the enabled set changed is deferred
to milestone 4, which reworks the charts anyway. And "revoking a key
mid-session produces the right message on every affected screen" has not been
exercised against a genuinely revoked key — the plumbing is there and unit
tested, but that acceptance criterion is unverified.
