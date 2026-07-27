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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGenerateText = mock(async (_params: any): Promise<any> => ({
  output: {
    headings: [
      { tag: 'h1', text: 'Test article title', keyPoint: 'Introduce the reader to the topic.' },
      { tag: 'h2', text: 'Key considerations', keyPoint: 'Cover the three main factors to evaluate.' },
      { tag: 'h2', text: 'Next steps', keyPoint: 'Give the reader one action to take today.' },
    ],
  },
}));

mock.module('ai', () => ({
  generateText: mockGenerateText,
  NoObjectGeneratedError: MockNoObjectGeneratedError,
  Output: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object: ({ schema }: any) => ({ __isOutputSchema: true, schema }),
  },
}));

mock.module('@/libs/ai/models', () => ({
  createAiGatewayModel: (modelId: string) => `mock-model-${modelId}`,
}));

mock.module('@/libs/ai/utils', () => ({
  getPrompt: async () => 'mock system prompt',
  logNoObjectGeneratedError: () => {},
}));

import { describe, expect, it, beforeEach } from 'bun:test';
import {
  generateOutline,
  OUTLINE_MODEL_ID,
  OutlineGenerationInput,
} from '@/libs/ai/promptArticles/generateOutline';
import { PromptArticleError } from '@/libs/ai/promptArticles/errors';
import type { SourceItem } from '@/libs/database/Sources/types';

const mockSource = (overrides: Partial<SourceItem> = {}): SourceItem => ({
  isCited: true,
  url: 'https://example.com/article',
  cleanUrl: 'example.com/article',
  hostname: 'example.com',
  title: 'Example Article',
  description: 'A useful article about something.',
  headings: [
    { tag: 'h1', text: 'Example Title' },
    { tag: 'h2', text: 'Background' },
    { tag: 'h2', text: 'Key takeaways' },
  ],
  ...overrides,
});

const baseInput: OutlineGenerationInput = {
  projectName: 'AllSearch',
  projectDomain: 'allsearch.io',
  promptName: 'best AI SEO tools',
  mode: 'create-new',
  sourcesToInspireFrom: [mockSource(), mockSource({ cleanUrl: 'other.com/piece' })],
};

beforeEach(() => {
  mockGenerateText.mockReset();
  mockGenerateText.mockImplementation(async () => ({
    output: {
      headings: [
        { tag: 'h1', text: 'Test article title', keyPoint: 'Introduce the reader to the topic.' },
        { tag: 'h2', text: 'Key considerations', keyPoint: 'Cover three main factors.' },
      ],
    },
  }));
});

describe('generateOutline', () => {
  it('returns a structured outline with headings on the happy path', async () => {
    const result = await generateOutline(baseInput);
    expect(result.headings.length).toBe(2);
    expect(result.headings[0].tag).toBe('h1');
  });

  it('calls generateText once with the outline model and Output.object schema', async () => {
    await generateOutline(baseInput);
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const call: any = mockGenerateText.mock.calls[0][0];
    expect(call.model).toBe(`mock-model-${OUTLINE_MODEL_ID}`);
    expect(call.output?.__isOutputSchema).toBe(true);
  });

  it('includes project name, domain, and prompt in the user prompt', async () => {
    await generateOutline(baseInput);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const call: any = mockGenerateText.mock.calls[0][0];
    expect(call.prompt).toContain('AllSearch');
    expect(call.prompt).toContain('allsearch.io');
    expect(call.prompt).toContain('best AI SEO tools');
  });

  it('renders each competing source with URL, title, and headings in the user prompt', async () => {
    await generateOutline(baseInput);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const call: any = mockGenerateText.mock.calls[0][0];
    expect(call.prompt).toContain('example.com/article');
    expect(call.prompt).toContain('Example Article');
    expect(call.prompt).toContain('H2: Background');
  });

  it('includes the ourSource block when mode is improve-existing', async () => {
    await generateOutline({
      ...baseInput,
      mode: 'improve-existing',
      ourSource: {
        cleanUrl: 'allsearch.io/our-article',
        title: 'Our underperforming article',
        headings: [{ tag: 'h1', text: 'Outdated Title' }],
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const call: any = mockGenerateText.mock.calls[0][0];
    expect(call.prompt).toContain('allsearch.io/our-article');
    expect(call.prompt).toContain('Our underperforming article');
    expect(call.prompt).toContain('improve-existing');
  });

  it('throws GENERATION_FAILED when the output has no headings', async () => {
    mockGenerateText.mockImplementation(async () => ({ output: { headings: [] } }));
    await expect(generateOutline(baseInput)).rejects.toBeInstanceOf(PromptArticleError);
    try {
      await generateOutline(baseInput);
    } catch (err) {
      expect((err as PromptArticleError).code).toBe('GENERATION_FAILED');
    }
  });

  it('maps NoObjectGeneratedError to GENERATION_FAILED', async () => {
    mockGenerateText.mockImplementation(async () => {
      throw new MockNoObjectGeneratedError('invalid json');
    });
    await expect(generateOutline(baseInput)).rejects.toBeInstanceOf(PromptArticleError);
    try {
      await generateOutline(baseInput);
    } catch (err) {
      expect((err as PromptArticleError).code).toBe('GENERATION_FAILED');
    }
  });

  it('maps rate-limit errors to GENERATION_RATE_LIMIT', async () => {
    mockGenerateText.mockImplementation(async () => {
      throw new Error('The model is busy (429 Too Many Requests)');
    });
    try {
      await generateOutline(baseInput);
    } catch (err) {
      expect((err as PromptArticleError).code).toBe('GENERATION_RATE_LIMIT');
    }
  });
});
