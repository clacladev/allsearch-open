import { mock } from 'bun:test';

import { ChatbotId } from '@/libs/database/shared/ChatbotId';

// A shared, mutable stub for the effective enabled set — issue 09's gate. Each test sets it to
// whatever selection it wants to exercise before calling `fetchDailyPrompt`.
let effectiveEnabledChatbotIds: ChatbotId[] = [];
mock.module('@/libs/database/Settings/queries', () => ({
  getEffectiveEnabledChatbotIds: async () => effectiveEnabledChatbotIds,
}));

const PROJECT = {
  id: 'project-1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  url: 'https://example.com',
  name: 'Example',
  aliases: [],
  icon_url: null,
  hostname: 'example.com',
  prompts_updated_at: null,
  is_paused: false,
  is_archived: false,
  target_location: null,
};

mock.module('@/libs/database/Projects/queries', () => ({
  getProjectRowWithId: async () => PROJECT,
  updateProjectRow: async () => PROJECT,
}));
mock.module('@/libs/database/Competitors/queries', () => ({
  getActiveCompetitorRowsWithProjectId: async () => [],
}));
mock.module('@/libs/database/Prompts/queries', () => ({
  getPromptRowsWithProjectId: async () => [],
}));

// Records every row `storePromptResponses` (a private step in the module under test) attempts to
// insert, so tests can assert brand_ids_ranking/sentiment stayed positionally aligned to the
// response each row came from — the concern raised by shortening the responses array below.
let insertedRows: Array<{ text: string; brand_ids_ranking: string[]; sentiment: unknown }> = [];
mock.module('@/libs/database/PromptResponses/queries', () => ({
  getPromptResponseRowsWithProjectIdInDateRange: async () => [],
  insertPromptResponseRows: mock(async (inputs: any[]) => {
    insertedRows = inputs;
    return inputs.map((input, index) => ({ ...input, id: `row-${index}` }));
  }),
}));
mock.module('@/libs/database/Sources/queries', () => ({
  insertSourceRows: mock(async () => []),
}));

// One mock per Chatbot's AI call so a test can assert a disabled Chatbot's underlying call is
// never made — not just that its response is absent from the result.
const mockChatGPT = mock(async () => ({
  response: { modelId: 'chatgpt-model' },
  text: 'chatgpt response text',
  sources: [],
  toolResults: [],
}));
const mockGoogleAIMode = mock(async () => ({
  response: { modelId: 'google-model' },
  text: 'google response text',
  sources: [],
  toolResults: [],
}));
const mockPerplexity = mock(async () => ({
  response: { modelId: 'perplexity-model' },
  text: 'perplexity response text',
  sources: [],
  toolResults: [],
}));
mock.module('@/libs/ai/projectPrompt/getPromptResponseWithChatGPT', () => ({
  getPromptResponseWithChatGPT: mockChatGPT,
}));
mock.module('@/libs/ai/projectPrompt/getPromptResponseWithGoogleAIMode', () => ({
  getPromptResponseWithGoogleAIMode: mockGoogleAIMode,
}));
mock.module('@/libs/ai/projectPrompt/getPromptResponseWithPerplexity', () => ({
  getPromptResponseWithPerplexity: mockPerplexity,
}));

// Distinguishing, deterministic stand-ins for the real analysis functions: each echoes back
// something derived from the response text it was given, so a test can tell which response a
// stored row's ranking/sentiment actually came from.
mock.module('@/libs/ai/sentimentAnalysis', () => ({
  analyzeResponseSentiment: mock(async (text: string) => ({ [text]: 1 })),
}));
mock.module('@/libs/utils/brandIdsRanking', () => ({
  getBrandIdsRankingsInText: mock((text: string) => [text]),
}));
mock.module('@/libs/collection/analyseSources', () => ({
  analysePromptResponseSources: async () => [],
}));

import { beforeEach, describe, expect, it } from 'bun:test';
import { fetchDailyPrompt } from '@/libs/workflows/fetchDailyPromptsForProject/steps';

beforeEach(() => {
  effectiveEnabledChatbotIds = [];
  insertedRows = [];
  mockChatGPT.mockClear();
  mockGoogleAIMode.mockClear();
  mockPerplexity.mockClear();
});

describe('fetchDailyPrompt — Chatbot gating (issue 09)', () => {
  it('only calls the chatbots in the effective enabled set', async () => {
    effectiveEnabledChatbotIds = [ChatbotId.ChatGPT, ChatbotId.Perplexity];

    await fetchDailyPrompt('my prompt', 'prompt-1', PROJECT.id, 'workflow-1');

    expect(mockChatGPT).toHaveBeenCalledTimes(1);
    expect(mockPerplexity).toHaveBeenCalledTimes(1);
    expect(mockGoogleAIMode).not.toHaveBeenCalled();
  });

  it('calls no chatbot at all when the effective enabled set is empty', async () => {
    effectiveEnabledChatbotIds = [];

    await fetchDailyPrompt('my prompt', 'prompt-1', PROJECT.id, 'workflow-1');

    expect(mockChatGPT).not.toHaveBeenCalled();
    expect(mockGoogleAIMode).not.toHaveBeenCalled();
    expect(mockPerplexity).not.toHaveBeenCalled();
    expect(insertedRows).toEqual([]);
  });

  it('keeps stored brand_ids_ranking and sentiment positionally aligned when a chatbot is disabled', async () => {
    // Google (the middle chatbot in canonical order) is disabled, so `responses` inside the
    // module under test is shorter than 3 — this is exactly the seam issue 09 asks to verify:
    // the shorter array must not misalign ranking/sentiment against the wrong response.
    effectiveEnabledChatbotIds = [ChatbotId.ChatGPT, ChatbotId.Perplexity];

    await fetchDailyPrompt('my prompt', 'prompt-1', PROJECT.id, 'workflow-1');

    expect(insertedRows).toHaveLength(2);

    const chatgptRow = insertedRows.find((row) => row.text === 'chatgpt response text');
    expect(chatgptRow?.brand_ids_ranking).toEqual(['chatgpt response text']);
    expect(chatgptRow?.sentiment).toEqual({ 'chatgpt response text': 1 });

    const perplexityRow = insertedRows.find((row) => row.text === 'perplexity response text');
    expect(perplexityRow?.brand_ids_ranking).toEqual(['perplexity response text']);
    expect(perplexityRow?.sentiment).toEqual({ 'perplexity response text': 1 });
  });
});
