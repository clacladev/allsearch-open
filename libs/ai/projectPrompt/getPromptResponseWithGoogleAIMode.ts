import { generateText, NoObjectGeneratedError } from 'ai';
import { google } from '@ai-sdk/google';
import { googleModel } from '../models';
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
    return generateText({
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
        // An ungrounded answer comes from training data and must not be stored as a
        // Prompt Response — providerMetadata.google.groundingMetadata.webSearchQueries
        // is how you tell the difference.
        google_search: google.tools.googleSearch({}),
      },
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) logNoObjectGeneratedError(error);
    throw error;
  }
}
