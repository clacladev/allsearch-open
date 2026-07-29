import { generateText, NoObjectGeneratedError } from 'ai';
import { openaiModel } from '../models';
import { parseTargetLocation } from '../userLocation';
import { logNoObjectGeneratedError } from '../utils';
import { openai, OpenAIResponsesProviderOptions } from '@ai-sdk/openai';

// Models: https://developers.openai.com/api/docs/models/all
// Most realistic is gpt-5-chat-latest (input $1.25, output $10.00 per 1M tokens): https://developers.openai.com/api/docs/models/gpt-5-chat-latest
// Good balance is gpt-5.4-nano (input $0.20, output $1.25 per 1M tokens): https://developers.openai.com/api/docs/models/gpt-5.4-nano
const MODEL_ID = 'gpt-5.4-nano';

export async function getPromptResponseWithChatGPT(
  prompt: string,
  targetLocation?: string | null
) {
  const userLocation = parseTargetLocation(targetLocation);
  try {
    return generateText({
      model: await openaiModel(MODEL_ID),
      prompt,
      providerOptions: {
        openai: {
          maxToolCalls: 1,
          textVerbosity: 'high', // gpt-5.4-nano is otherwise very concise
        } satisfies OpenAIResponsesProviderOptions,
      },
      tools: {
        web_search: openai.tools.webSearch({
          ...(userLocation ? { userLocation: { type: 'approximate', ...userLocation } } : {}),
        }),
      },
      toolChoice: { type: 'tool', toolName: 'web_search' }, // Force the tool to be used
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) logNoObjectGeneratedError(error);
    throw error;
  }
}
