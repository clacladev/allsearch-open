import { generateText, NoObjectGeneratedError, Output } from 'ai';
import { googleModel } from '../models';
import z from 'zod';
import { getPrompt, logNoObjectGeneratedError } from '../utils';
import { google } from '@ai-sdk/google';

const MODEL_ID = 'gemini-3.1-flash-lite';
const RESEARCH_PROMPT_FILE_PATH = 'libs/ai/productPromptIdeas/researchSystemPrompt.md';
const OBJECT_PROMPT_FILE_PATH = 'libs/ai/productPromptIdeas/objectSystemPrompt.md';

const PromptGroupSchema = z.object({
  group: z.string().describe('Category/group name for this set of prompts'),
  prompts: z
    .array(z.string().describe('A prompt a shopper would ask an AI assistant'))
    .length(3)
    .describe('List of exactly 3 prompts for this group'),
});

const PromptGroupsSchema = z
  .array(PromptGroupSchema)
  .length(4)
  .describe('Exactly 4 groups of product prompt ideas (12 prompts total)');

export type PromptGroup = z.infer<typeof PromptGroupSchema>;
export type PromptGroups = z.infer<typeof PromptGroupsSchema>;

export async function getProductPromptIdeas(url: string): Promise<PromptGroups> {
  const researchSystemPrompt = await getPrompt(RESEARCH_PROMPT_FILE_PATH);
  const objectSystemPrompt = await getPrompt(OBJECT_PROMPT_FILE_PATH);

  try {
    const { text } = await generateText({
      model: await googleModel(MODEL_ID),
      tools: {
        url_context: google.tools.urlContext({}),
      },
      system: researchSystemPrompt,
      prompt: url,
    });

    const { output } = await generateText({
      model: await googleModel(MODEL_ID),
      output: Output.object({ schema: PromptGroupsSchema }),
      system: objectSystemPrompt,
      prompt: text,
    });

    return output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) logNoObjectGeneratedError(error);
    throw error;
  }
}
