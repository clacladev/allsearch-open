import { generateText, NoObjectGeneratedError } from 'ai';
import { AIAnalyticsProps, createAiGatewayModel } from '../models';
import { logNoObjectGeneratedError } from '../utils';

// Pricing: https://docs.perplexity.ai/docs/getting-started/pricing
// Notes: How to replicate the Perplexity web app experience via API.
// sonar: Perplexity's search model, grounds responses in real-time web search results and returns cited sources.
// (input $1, output $1 per 1M tokens)
// Vercel AI Gateway https://vercel.com/ai-gateway/models
const MODEL_ID = 'perplexity/sonar';

export async function getPromptResponseWithPerplexity(
  prompt: string,
  aiAnalyticsProps?: AIAnalyticsProps
) {
  const analyticsProps: AIAnalyticsProps = {
    ...aiAnalyticsProps,
    operationId: 'prompt-response:perplexity',
  };
  try {
    return generateText({
      model: createAiGatewayModel(MODEL_ID, analyticsProps),
      prompt,
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) logNoObjectGeneratedError(error);
    throw error;
  }
}
