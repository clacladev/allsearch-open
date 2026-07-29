import { generateText, NoObjectGeneratedError } from 'ai';
import { perplexityModel } from '../models';
import { logNoObjectGeneratedError } from '../utils';

// Pricing: https://docs.perplexity.ai/docs/getting-started/pricing
// Notes: How to replicate the Perplexity web app experience via API.
// sonar: Perplexity's search model, grounds responses in real-time web search results and returns cited sources.
// (input $1, output $1 per 1M tokens)
const MODEL_ID = 'sonar';

// @ai-sdk/perplexity@3.x exposes no user-location option: the installed
// types export only PerplexityProvider, PerplexityProviderSettings, VERSION,
// createPerplexity and perplexity, with zero occurrences of "location". So,
// unlike the ChatGPT adapter, no targetLocation parameter is threaded through
// here.
export async function getPromptResponseWithPerplexity(prompt: string) {
  try {
    return generateText({
      model: await perplexityModel(MODEL_ID),
      prompt,
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) logNoObjectGeneratedError(error);
    throw error;
  }
}
