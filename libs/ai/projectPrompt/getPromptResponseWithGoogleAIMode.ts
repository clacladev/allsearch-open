import { generateText, NoObjectGeneratedError } from 'ai';
import { google } from '@ai-sdk/google';
import { googleModel } from '../models';
import { assertResponseIsGrounded } from '../grounding';
import { logNoObjectGeneratedError } from '../utils';

// Models: https://ai.google.dev/gemini-api/docs/models
// Prices: https://ai.google.dev/gemini-api/docs/pricing
// AI Overviews feel: gemini-3.1-flash or gemini-3.1-flash-lite with google_search grounding.
// Cost note: the $14 per 1000 searches grounding fee dominates the bill, not the token rate
// ($0.25 in / $1.50 out per 1M). At ~$0.014 per call, grounding is ~10x more than the same
// call on gpt-5.4-nano (web_search included) and ~14x more than perplexity/sonar (flat token
// price includes search). If this line item gets too expensive, the levers are: drop the
// model from the daily fan-out, halve cron frequency, or replace google_search with
// urlContext + a curated URL list.
const MODEL_ID = 'gemini-3.1-flash-lite';

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
