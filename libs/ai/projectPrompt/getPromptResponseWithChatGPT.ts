import { generateText, NoObjectGeneratedError } from 'ai';
import { openaiModel } from '../models';
import { parseTargetLocation } from '../userLocation';
import { logNoObjectGeneratedError } from '../utils';
import { openai, OpenAIResponsesProviderOptions } from '@ai-sdk/openai';

// Models: https://developers.openai.com/api/docs/models/all
// gpt-5.6-luna is the actual default model for ChatGPT Free/Go since 2026-08-06 (replacing
// GPT-5.5 Instant), not just a same-cost-tier stand-in: https://openai.com/index/improving-gpt-5-6-sol-in-chatgpt/
// Cost-sensitive/high-volume tier (input $0.20, output $1.20 per 1M tokens): https://developers.openai.com/api/docs/models/gpt-5.6-luna
const MODEL_ID = 'gpt-5.6-luna';

export async function getPromptResponseWithChatGPT(
  prompt: string,
  targetLocation?: string | null,
  signal?: AbortSignal
) {
  const userLocation = parseTargetLocation(targetLocation);
  try {
    return generateText({
      model: await openaiModel(MODEL_ID),
      prompt,
      abortSignal: signal,
      providerOptions: {
        openai: {
          maxToolCalls: 1,
          textVerbosity: 'high', // gpt-5.6-luna is otherwise very concise
          reasoningEffort: 'none', // Free ChatGPT's default (pre-"Think" button) is instant, not the API's own "medium" default
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
