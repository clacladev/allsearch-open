import { generateText, NoObjectGeneratedError } from 'ai';
import { google } from '@ai-sdk/google';
import { AIAnalyticsProps, createAiGatewayModel } from '../models';
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
// Vercel AI Gateway https://vercel.com/ai-gateway/models
const MODEL_ID = 'google/gemini-3.1-flash-lite';

export async function getPromptResponseWithGoogleAIMode(
  prompt: string,
  aiAnalyticsProps?: AIAnalyticsProps
) {
  const analyticsProps: AIAnalyticsProps = {
    ...aiAnalyticsProps,
    operationId: 'prompt-response:google-ai',
  };
  try {
    return generateText({
      model: createAiGatewayModel(MODEL_ID, analyticsProps),
      prompt,
      temperature: 1.0, // Recommended by Google for optimal grounding results
      tools: {
        // Grounded retrieval is effectively always-on for Gemini 2.0+/3.x when this
        // tool is enabled, mirroring AI Overviews behavior. Dynamic retrieval (where
        // the model chose whether to search) was a Gemini 1.5 feature and is not
        // available in @ai-sdk/google v3 — the only knobs here are searchTypes and
        // timeRangeFilter.
        google_search: google.tools.googleSearch({}),
      },
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) logNoObjectGeneratedError(error);
    throw error;
  }
}
