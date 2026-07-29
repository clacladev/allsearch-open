import { generateText, NoObjectGeneratedError, Output } from 'ai';
import { googleModel } from '../models';
import z from 'zod';
import { getPrompt, logNoObjectGeneratedError } from '../utils';
import { google } from '@ai-sdk/google';

// Models: https://ai.google.dev/gemini-api/docs/models
const MODEL_ID = 'gemini-3.1-flash-lite';
const RESEARCH_PROMPT_FILE_PATH = 'libs/ai/competitors/researchSystemPrompt.md';
const OBJECT_PROMPT_FILE_PATH = 'libs/ai/competitors/objectSystemPrompt.md';
const MAX_COMPETITORS = 5;

const Schema = z
  .array(
    z.object({
      name: z.string().describe('Competitor name. Max 5 words long'),
      url: z.string().describe('Competitor URL'),
    })
  )
  .describe(`List of competitors. Max ${MAX_COMPETITORS} competitors`);

export async function getCompetitors(
  url: string,
  name: string,
  categories: string[],
  targetLocation: string | undefined
): Promise<{ name: string; url: string }[]> {
  const researchSystemPrompt = await getPrompt(RESEARCH_PROMPT_FILE_PATH);
  const objectSystemPrompt = await getPrompt(OBJECT_PROMPT_FILE_PATH);
  const normalizedTargetLocation = targetLocation?.trim();
  const promptContextLines = [
    `- Name: ${name}`,
    `- Domain: ${url}`,
    `- Categories: ${categories.join(', ')}.`,
    ...(normalizedTargetLocation ? [`- Target location: ${normalizedTargetLocation}`] : []),
  ];

  try {
    const { text } = await generateText({
      model: await googleModel(MODEL_ID),
      tools: {
        url_context: google.tools.urlContext({}),
        google_search: google.tools.googleSearch({}),
      },
      system: researchSystemPrompt,
      prompt: promptContextLines.join('\n'),
    });

    const { output } = await generateText({
      model: await googleModel(MODEL_ID),
      output: Output.object({ schema: Schema }),
      system: objectSystemPrompt,
      prompt: text,
    });

    return output.slice(0, MAX_COMPETITORS);
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) logNoObjectGeneratedError(error);
    throw error;
  }
}
