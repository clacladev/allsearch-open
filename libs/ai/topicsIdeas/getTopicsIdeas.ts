import { generateText, NoObjectGeneratedError, Output } from 'ai';
import { createAiGatewayModel, AIAnalyticsProps } from '../models';
import { getPrompt, logNoObjectGeneratedError } from '../utils';
import z from 'zod';
import { google } from '@ai-sdk/google';

// Models: https://ai.google.dev/gemini-api/docs/models
const MODEL_ID = 'google/gemini-3.1-flash-lite';
const RESEARCH_PROMPT_FILE_PATH = 'libs/ai/topicsIdeas/researchSystemPrompt.md';
const OBJECT_PROMPT_FILE_PATH = 'libs/ai/topicsIdeas/objectSystemPrompt.md';
const MAX_TOPICS = 5;

const Schema = z
  .array(z.string().describe('Between 1 and 5 words long'))
  .describe(`List of categories. Max ${MAX_TOPICS} categories.`);

export type TopicsNames = string[];

export async function getTopicsIdeas(
  url: string,
  name: string,
  aiAnalyticsProps?: AIAnalyticsProps
): Promise<TopicsNames> {
  const researchSystemPrompt = await getPrompt(RESEARCH_PROMPT_FILE_PATH);
  const objectSystemPrompt = await getPrompt(OBJECT_PROMPT_FILE_PATH);

  const analyticsProps: AIAnalyticsProps = { ...aiAnalyticsProps, operationId: 'topics-ideas' };
  try {
    const { text } = await generateText({
      model: createAiGatewayModel(MODEL_ID, analyticsProps),
      tools: {
        url_context: google.tools.urlContext({}),
        google_search: google.tools.googleSearch({}),
      },
      system: researchSystemPrompt,
      prompt: `
        - Name: ${name}
        - Domain: ${url}`,
    });

    const { output } = await generateText({
      model: createAiGatewayModel(MODEL_ID, analyticsProps),
      output: Output.object({ schema: Schema }),
      system: objectSystemPrompt,
      prompt: text,
    });

    return output.slice(0, MAX_TOPICS);
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) logNoObjectGeneratedError(error);
    throw error;
  }
}
