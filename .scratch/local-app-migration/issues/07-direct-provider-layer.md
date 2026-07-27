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
