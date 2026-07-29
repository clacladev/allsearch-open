# Direct provider keys, not an AI gateway

The SaaS routed all inference through Vercel AI Gateway with a single key we
owned. Locally the user pays for their own inference, so they must supply their
own credentials. We take keys for OpenAI, Google and Perplexity directly via
`@ai-sdk/openai`, `@ai-sdk/google` and `@ai-sdk/perplexity` rather than offering
a one-key aggregator such as OpenRouter.

The reason is measurement fidelity. What a Chatbot answers is only meaningful if
it searched the live web the way that provider actually searches: ChatGPT's
forced `web_search` tool, Gemini's `googleSearch` grounding, Sonar's built-in
retrieval. An aggregator that substitutes its own search layer would silently
turn "what ChatGPT says about this brand" into "what a small model says when fed
someone else's search results", which is a different and much weaker claim.

## Consequences

- Three keys instead of one, but they are not equal and onboarding exploits that:
  **Google alone yields a fully working product**, because every non-Chatbot AI
  feature (sentiment, topic ideas, prompt ideas, competitor discovery, article
  outlines, article generation) runs on Gemini. OpenAI and Perplexity each unlock
  exactly one further Chatbot.
- Chatbots degrade independently. A user with one key sees one Chatbot's data and
  empty states for the others. Visibility percentages are computed across
  responses, so they shift when a key is added: the UI must make clear which
  Chatbots a figure covers.
- Adding Claude as a fourth Chatbot becomes cheap later, since each Chatbot is
  now just a provider adapter plus a key. Not in the first version.
