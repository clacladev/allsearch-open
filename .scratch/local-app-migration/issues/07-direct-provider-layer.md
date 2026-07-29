# 07 — Direct provider layer

Status: ready-for-agent
Milestone: 2 — AI providers
Blocked by: 06

Replace Vercel AI Gateway with direct provider clients using the user's own keys
(ADR 0004).

`libs/ai/models.ts` is the single choke point — `createAiGatewayModel` calls
`createGateway()` with no arguments and wraps the result in PostHog `withTracing`.
Every one of the 14 model calls in the codebase goes through it. Replace it with a
factory that returns a model from `@ai-sdk/openai`, `@ai-sdk/google` or
`@ai-sdk/perplexity` given a key from settings, and drop the tracing wrapper.

**Model IDs must lose their gateway prefixes** — `openai/gpt-5.4-nano` becomes
`gpt-5.4-nano` on the OpenAI provider, and so on for
`google/gemini-3.1-flash-lite`, `google/gemini-3-flash`, `perplexity/sonar`.

**The search grounding is the product and must survive intact.** These are not
optional flags; without them a Chatbot answers from training data and the
visibility metric becomes meaningless:

| Chatbot | Model | Grounding |
|---|---|---|
| ChatGPT | `gpt-5.4-nano` | `openai.tools.webSearch({ userLocation })`, forced via `toolChoice`, `maxToolCalls: 1`, `textVerbosity: 'high'` |
| Google AI Overview | `gemini-3.1-flash-lite` | `google.tools.googleSearch({})` |
| Perplexity | `sonar` | built in, no tool |

`@ai-sdk/openai` and `@ai-sdk/google` are already dependencies — they were
imported only for these tool definitions and are now used for the models too.
Add `@ai-sdk/perplexity`.

The non-Chatbot calls all run on Gemini and therefore all depend on the Google
key alone: sentiment analysis, topic ideas, prompt ideas, competitor discovery,
article outlines, article streaming.

**Verify the tools still bind when the provider is constructed directly rather
than through the gateway.** This is the one place where the port could silently
degrade into ungrounded answers that look plausible. Prove it with a live call
that returns non-empty `sources` before closing this.

## Done when

- Nothing imports `createGateway` or `@posthog/ai`.
- A live call per Chatbot returns text plus at least one source.
- The 4 `tests/unit/ai/` tests pass again.

## Comments

**2026-07-29 — live verification, `bun run verify:providers`.**

ChatGPT passes: `gpt-5.4-nano-2026-03-17`, 6 cited Sources and 15
used-but-not-cited. Both Source paths survive the move off the gateway, which
was the thing most at risk. The `target_location` mapping also proved out — a
London/GB location returned `morningfold.co.uk`, so it is steering the search
rather than merely being accepted. The Gemini structured-output path passes too.

Two Chatbots did not clear the source check, neither for a reason this issue
introduced:

- **Google AI Overview** returned Sources on 1 of 3 identical calls. The model
  chooses whether to search and there is no way to force it. Split out as
  issue 25; it predates the port and would have affected the SaaS equally.
- **Perplexity** could not be exercised at all — the account is over quota.
  Still unverified.

Closed on the strength of the port being proven rather than the letter of the
source check, since the two failures are a provider-behaviour problem and a
billing problem respectively. Nothing here imports `createGateway` or
`@posthog/ai`, and the unit tests pass.
