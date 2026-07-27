import { generateText, NoObjectGeneratedError, Output } from 'ai';
import { createAiGatewayModel, AIAnalyticsProps } from '../models';
import z from 'zod';
import { getPrompt, logNoObjectGeneratedError } from '../utils';
import { google } from '@ai-sdk/google';

// Models: https://ai.google.dev/gemini-api/docs/models
const MODEL_ID = 'google/gemini-3.1-flash-lite';
const RESEARCH_PROMPT_FILE_PATH = 'libs/ai/promptsIdeas/researchSystemPrompt.md';
const OBJECT_PROMPT_FILE_PATH = 'libs/ai/promptsIdeas/objectSystemPrompt.md';
const MAX_PROMPTS = 3;

const TopicSchema = z.object({
  topic: z.string().describe('Topic name. Max 15 words long'),
  prompts: z
    .array(z.string().describe('A prompt. Max 15 words long'))
    .describe(`List of prompts. Max ${MAX_PROMPTS} prompts`),
});

const TopicsSchema = z.array(TopicSchema).describe(`List of prompt topics`);

export type Topic = z.infer<typeof TopicSchema>;
export type Topics = z.infer<typeof TopicsSchema>;

export async function getPromptsIdeas(
  url: string,
  name: string,
  categories: string[],
  targetLocation: string | undefined,
  aiAnalyticsProps?: AIAnalyticsProps
): Promise<Topics> {
  const researchSystemPrompt = await getPrompt(RESEARCH_PROMPT_FILE_PATH);
  const objectSystemPrompt = await getPrompt(OBJECT_PROMPT_FILE_PATH);
  const normalizedTargetLocation = targetLocation?.trim();
  const promptContextLines = [
    `- Name: ${name}`,
    `- Domain: ${url}`,
    `- Categories: ${categories.join(', ')}.`,
    ...(normalizedTargetLocation ? [`- Target location: ${normalizedTargetLocation}`] : []),
  ];

  const analyticsProps: AIAnalyticsProps = { ...aiAnalyticsProps, operationId: 'prompts-ideas' };
  try {
    const { text } = await generateText({
      model: createAiGatewayModel(MODEL_ID, analyticsProps),
      tools: {
        url_context: google.tools.urlContext({}),
        google_search: google.tools.googleSearch({}),
      },
      system: researchSystemPrompt,
      prompt: promptContextLines.join('\n'),
    });

    const { output } = await generateText({
      model: createAiGatewayModel(MODEL_ID, analyticsProps),
      output: Output.object({ schema: TopicsSchema }),
      system: objectSystemPrompt,
      prompt: text,
    });

    return output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) logNoObjectGeneratedError(error);
    throw error;
  }
}
