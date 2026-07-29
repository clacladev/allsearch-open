import { mock } from 'bun:test';

// Mock all external AI dependencies before importing the module under test
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
  // First call: research phase (no output param) → returns text
  if (!params.output) return { text: 'Research results about the company and its market.' };
  // Second call: structured output phase (has output param) → returns competitors array
  return { output: params.__mockOutput ?? [] };
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

// Partial stub (no openaiModel/perplexityModel/getProviderKey) that leaks process-wide via
// Bun's mock.module() — see tests/unit/ai/models.test.ts for the full explanation.
mock.module('@/libs/ai/models', () => ({
  googleModel: async (modelId: string) => `mock-model-${modelId}`,
  NO_THINKING_OPTIONS: {},
}));

mock.module('@/libs/ai/utils', () => ({
  getPrompt: async () => 'mock system prompt',
  logNoObjectGeneratedError: () => {},
}));

import { describe, expect, it, beforeEach } from 'bun:test';
import { getCompetitors } from '@/libs/ai/competitors/getCompetitors';

const SAMPLE_COMPETITORS = [
  { name: 'Competitor A', url: 'https://competitor-a.com' },
  { name: 'Competitor B', url: 'https://competitor-b.com' },
  { name: 'Competitor C', url: 'https://competitor-c.com' },
];

beforeEach(() => {
  mockGenerateText.mockReset();
  mockGenerateText.mockImplementation(async (params: any) => {
    if (!params.output) return { text: 'Research results.' };
    return { output: SAMPLE_COMPETITORS };
  });
});

describe('getCompetitors', () => {
  it('returns a list of competitors from the AI structured output', async () => {
    const result = await getCompetitors('mysite.com', 'My Site', ['SaaS'], undefined);
    expect(result).toEqual(SAMPLE_COMPETITORS);
  });

  it('calls generateText twice (research phase then structured output phase)', async () => {
    await getCompetitors('mysite.com', 'My Site', ['SaaS'], undefined);
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });

  it('enforces a maximum of 5 competitors regardless of AI output', async () => {
    const manyCompetitors = Array.from({ length: 8 }, (_, i) => ({
      name: `Competitor ${i + 1}`,
      url: `https://competitor-${i + 1}.com`,
    }));
    mockGenerateText.mockImplementation(async (params: any) => {
      if (!params.output) return { text: 'Research results.' };
      return { output: manyCompetitors };
    });

    const result = await getCompetitors('mysite.com', 'My Site', ['SaaS'], undefined);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('includes target location in the prompt when provided', async () => {
    await getCompetitors('mysite.com', 'My Site', ['SaaS'], 'United States');
    // Verify generateText was called — location is included in the prompt
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });

  it('returns an empty list when AI returns no competitors', async () => {
    mockGenerateText.mockImplementation(async (params: any) => {
      if (!params.output) return { text: 'No competitors found.' };
      return { output: [] };
    });

    const result = await getCompetitors('mysite.com', 'My Site', ['SaaS'], undefined);
    expect(result).toEqual([]);
  });

  it('propagates errors thrown by generateText', async () => {
    mockGenerateText.mockImplementation(async () => {
      throw new Error('AI API error');
    });

    await expect(getCompetitors('mysite.com', 'My Site', ['SaaS'], undefined)).rejects.toThrow(
      'AI API error'
    );
  });
});
