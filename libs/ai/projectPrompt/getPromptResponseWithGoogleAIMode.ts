import { generateText, NoObjectGeneratedError } from 'ai';
import { google } from '@ai-sdk/google';
import { googleModel } from '../models';
import { assertResponseIsGrounded } from '../grounding';
import { logNoObjectGeneratedError } from '../utils';

// Models: https://ai.google.dev/gemini-api/docs/models
// Prices: https://ai.google.dev/gemini-api/docs/pricing
// AI Overviews/AI Mode actually run on Google's own custom Gemini 3 fine-tunes wired into
// Search's index/ranking/Knowledge Graph, so no public API model is a literal match — this is
// a best-effort proxy. gemini-3.6-flash is the newest GA Flash model (2026-07-21), superseding
// the 3.1 generation this used to point at; there is no gemini-3.6-flash-lite (only
// gemini-3.5-flash-lite exists as of this writing) so flash is the closest current option.
// Cost note: the $14 per 1000 searches grounding fee still dominates the bill, not the token
// rate ($1.50 in / $7.50 out per 1M, up from 3.1-flash-lite's rate). At ~$0.014 per call,
// grounding alone is already several times a gpt-5.6-luna call (web_search included) and far
// more than perplexity/sonar (flat token price includes search). If this line item gets too
// expensive, the levers are: drop the model from the daily fan-out, halve cron frequency, or
// replace google_search with urlContext + a curated URL list.
const MODEL_ID = 'gemini-3.6-flash';

export async function getPromptResponseWithGoogleAIMode(prompt: string) {
  try {
    // Awaited, not returned as a bare promise: the grounding check below needs the resolved
    // result, and it also puts an async rejection back inside this try — a returned promise
    // escaped it, so the `NoObjectGeneratedError` branch could never actually fire.
    const response = await generateText({
      model: await googleModel(MODEL_ID),
      prompt,
      temperature: 1.0, // Recommended by Google for optimal grounding results
      tools: {
        // Enabling this tool permits grounding, it does not guarantee it: the model
        // still decides per call whether to search, and measurably often does not
        // (issue 25 — 2 of 3 identical calls came back with no Sources at all). There
        // is no way to force it. Dynamic retrieval, where a threshold controlled the
        // decision, was a Gemini 1.5 feature and is gone; the only knobs left here are
        // searchTypes and timeRangeFilter, and OpenAI's toolChoice has no equivalent.
        google_search: google.tools.googleSearch({}),
      },
    });

    // Which is why every call is checked afterwards instead: an ungrounded answer comes from
    // training data and must never be stored as a Prompt Response (issue 25). Throwing here —
    // rather than returning a response the caller has to remember to inspect — is what routes it
    // into the same bounded retry and `failed`-item path as any other Chatbot failure.
    assertResponseIsGrounded(response);

    return response;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) logNoObjectGeneratedError(error);
    throw error;
  }
}
