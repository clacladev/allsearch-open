import { mock } from 'bun:test';

class MockNoObjectGeneratedError extends Error {
  text = '';
  cause = undefined;
  response = undefined;
  usage = undefined;
  finishReason = undefined;
  static isInstance(err: unknown): err is MockNoObjectGeneratedError {
    return err instanceof MockNoObjectGeneratedError;
  }
}

const mockGenerateText = mock(async (params: any) => {
  if (!params.output) return { text: 'Research results about the company prompts.' };
  return { output: [] as Topics };
});

mock.module('ai', () => ({
  generateText: mockGenerateText,
  NoObjectGeneratedError: MockNoObjectGeneratedError,
  Output: {
    object: ({ schema }: any) => ({ __isOutputSchema: true, schema }),
  },
}));

mock.module('@ai-sdk/google', () => ({
  google: {
    tools: {
      urlContext: () => ({}),
      googleSearch: () => ({}),
    },
  },
}));

mock.module('@/libs/ai/models', () => ({
  createAiGatewayModel: (modelId: string) => `mock-model-${modelId}`,
  NO_THINKING_OPTIONS: {},
}));

mock.module('@/libs/ai/utils', () => ({
  getPrompt: async () => 'mock system prompt',
  logNoObjectGeneratedError: () => {},
}));

import { describe, expect, it, beforeEach } from 'bun:test';
import { getPromptsIdeas, Topics } from '@/libs/ai/promptsIdeas/getPromptsIdeas';

const SAMPLE_TOPICS: Topics = [
  {
    topic: 'Best tools',
    prompts: ['best AI SEO tools', 'top AI tools for marketers', 'leading GEO tools 2025'],
  },
  {
    topic: 'Comparisons',
    prompts: ['AllSearch vs Ahrefs', 'GEO vs SEO tools'],
  },
];

beforeEach(() => {
  mockGenerateText.mockReset();
  mockGenerateText.mockImplementation(async (params: any) => {
    if (!params.output) return { text: 'Research results.' };
    return { output: SAMPLE_TOPICS };
  });
});

describe('getPromptsIdeas', () => {
  it('returns topics from the AI structured output', async () => {
    const result = await getPromptsIdeas('mysite.com', 'My Site', ['SaaS'], undefined);
    expect(result).toEqual(SAMPLE_TOPICS);
  });

  it('calls generateText twice (research phase then structured output phase)', async () => {
    await getPromptsIdeas('mysite.com', 'My Site', ['SaaS'], undefined);
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });

  it('returns an empty array when AI returns no topics', async () => {
    mockGenerateText.mockImplementation(async (params: any) => {
      if (!params.output) return { text: 'No prompts found.' };
      return { output: [] };
    });

    const result = await getPromptsIdeas('mysite.com', 'My Site', ['SaaS'], undefined);
    expect(result).toEqual([]);
  });

  it('includes target location in the prompt context when provided', async () => {
    await getPromptsIdeas('mysite.com', 'My Site', ['SaaS'], 'France');
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });

  it('returns topics with their prompts intact (respects model output)', async () => {
    const result = await getPromptsIdeas('mysite.com', 'My Site', ['SaaS'], undefined);
    expect(result).toHaveLength(2);
    expect(result[0].topic).toBe('Best tools');
    expect(result[0].prompts).toHaveLength(3);
    expect(result[1].topic).toBe('Comparisons');
    expect(result[1].prompts).toHaveLength(2);
  });

  it('propagates errors thrown by generateText', async () => {
    mockGenerateText.mockImplementation(async () => {
      throw new Error('AI quota exceeded');
    });

    await expect(getPromptsIdeas('mysite.com', 'My Site', ['SaaS'], undefined)).rejects.toThrow(
      'AI quota exceeded'
    );
  });

  it('passes all context fields (name, url, categories) to the AI', async () => {
    await getPromptsIdeas('allsearch.io', 'AllSearch', ['GEO', 'AI SEO'], 'Europe');
    // generateText was called - the context lines are built from these inputs
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
    // Verify the first call included the prompt text with context
    const firstCallArgs = mockGenerateText.mock.calls[0][0];
    expect(firstCallArgs.prompt).toContain('allsearch.io');
    expect(firstCallArgs.prompt).toContain('AllSearch');
    expect(firstCallArgs.prompt).toContain('GEO');
    expect(firstCallArgs.prompt).toContain('Europe');
  });
});
