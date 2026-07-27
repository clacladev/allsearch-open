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
