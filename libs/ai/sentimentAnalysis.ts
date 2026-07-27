import { generateText, NoObjectGeneratedError, Output } from 'ai';
import { createAiGatewayModel, AIAnalyticsProps } from './models';
import z from 'zod';
import { logNoObjectGeneratedError } from './utils';
import { BrandsSentiment, SentimentLevel } from '@/libs/database/PromptResponses/types';

const MODEL_ID = 'google/gemini-3.1-flash-lite';

const VALID_SENTIMENT_VALUES = ['-2', '-1', '0', '1', '2'] as const;

const Schema = z
  .array(
    z.object({
      brandId: z.string().describe('The brand ID'),
      sentiment: z
        .enum(VALID_SENTIMENT_VALUES)
        .describe(
          'Sentiment score: -2 (very negative), -1 (negative), 0 (neutral), 1 (positive), 2 (very positive)'
        ),
    })
  )
  .describe('Per-brand sentiment for brands mentioned in the text');

const SYSTEM_PROMPT = `You are a sentiment analysis expert. Given a text and a list of brands, analyze the sentiment expressed toward each brand that is mentioned or discussed in the text.

Rules:
- Only include brands that are actually mentioned or clearly referenced in the text.
- Score each brand from -2 to +2:
  - -2: Very negative (harsh criticism, warnings against using)
  - -1: Negative (mild criticism, disadvantages mentioned)
  - 0: Neutral (factual mention, no opinion expressed)
  - 1: Positive (mild praise, advantages mentioned)
  - 2: Very positive (strong recommendation, enthusiastic praise)
- If a brand is not mentioned in the text at all, do NOT include it.`;

export async function analyzeResponseSentiment(
  responseText: string,
  brands: Array<{ id: string; name: string }>,
  aiAnalyticsProps?: AIAnalyticsProps
): Promise<BrandsSentiment> {
  const brandListLines = brands.map((b) => `- ID: ${b.id}, Name: ${b.name}`).join('\n');
  const prompt = `## Brands\n${brandListLines}\n\n## Text to analyze\n${responseText}`;

  const analyticsProps: AIAnalyticsProps = {
    ...aiAnalyticsProps,
    operationId: 'sentiment-analysis',
  };
  try {
    const { output } = await generateText({
      model: createAiGatewayModel(MODEL_ID, analyticsProps),
      output: Output.object({ schema: Schema }),
      system: SYSTEM_PROMPT,
      prompt,
    });

    const result: BrandsSentiment = {};
    const validBrandIds = new Set(brands.map((b) => b.id));
    for (const item of output) {
      if (validBrandIds.has(item.brandId)) {
        result[item.brandId] = Number(item.sentiment) as SentimentLevel;
      }
    }
    return result;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) logNoObjectGeneratedError(error);
    throw error;
  }
}
