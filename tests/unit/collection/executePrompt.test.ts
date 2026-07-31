import { mock } from 'bun:test';

import { ChatbotId } from '@/libs/database/shared/ChatbotId';

// A shared, mutable stub for the effective enabled set (issue 09's gate), used only by the case
// that omits an explicit `chatbotIds` list.
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
}));
mock.module('@/libs/database/Competitors/queries', () => ({
  getActiveCompetitorRowsWithProjectId: async () => [],
}));

// Records every row `storePromptResponses` (a private function in the module under test) attempts
// to insert, so tests can assert brand_ids_ranking/sentiment/run_id/workflow_id stayed positionally
// aligned to the response each row came from.
let insertedRows: Array<{
  text: string;
  brand_ids_ranking: string[];
  sentiment: unknown;
  run_id: string | null;
  workflow_id: string;
}> = [];
mock.module('@/libs/database/PromptResponses/queries', () => ({
  insertPromptResponseRows: mock(async (inputs: any[]) => {
    insertedRows = inputs;
    return inputs.map((input, index) => ({ ...input, id: `row-${index}` }));
  }),
}));
mock.module('@/libs/database/Sources/queries', () => ({
  insertSourceRows: mock(async () => []),
}));

// One mock per Chatbot's AI call so a test can assert only the requested Chatbots are ever called.
const mockChatGPT = mock(async () => ({
  response: { modelId: 'chatgpt-model' },
  text: 'chatgpt response text',
  sources: [],
  toolResults: [],
}));
const mockGoogleAIMode = mock(async () => {
  throw new Error('Google AI Mode is down');
});
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
import { executePrompt } from '@/libs/collection/executePrompt';
import { clearProviderCooldowns } from '@/libs/collection/providerCooldown';

beforeEach(() => {
  // `providerCooldown` is a module-level singleton shared by every caller of `callAiWithRetry` in
  // the test process; a cooldown left open by another suite (e.g. tests/unit/collection/callAi.test.ts)
  // would otherwise make this file's real, uninjected `sleep` wait it out.
  clearProviderCooldowns();
  effectiveEnabledChatbotIds = [];
  insertedRows = [];
  mockChatGPT.mockClear();
  mockGoogleAIMode.mockClear();
  mockPerplexity.mockClear();
});

describe('executePrompt', () => {
  it('keeps stored brand_ids_ranking and sentiment positionally aligned when the middle Chatbot fails', async () => {
    // Google (the middle chatbot in canonical order) rejects, so `responses` inside the module
    // under test is shorter than the requested chatbotIds — the seam issue 09/10 asks to verify:
    // the shorter array must not misalign ranking/sentiment against the wrong response.
    const outcomes = await executePrompt({
      promptId: 'prompt-1',
      promptName: 'my prompt',
      projectId: PROJECT.id,
      chatbotIds: [ChatbotId.ChatGPT, ChatbotId.GoogleAIOverview, ChatbotId.Perplexity],
      workflowId: 'workflow-1',
    });

    expect(mockChatGPT).toHaveBeenCalledTimes(1);
    expect(mockGoogleAIMode).toHaveBeenCalledTimes(1);
    expect(mockPerplexity).toHaveBeenCalledTimes(1);

    expect(insertedRows).toHaveLength(2);

    const chatgptRow = insertedRows.find((row) => row.text === 'chatgpt response text');
    expect(chatgptRow?.brand_ids_ranking).toEqual(['chatgpt response text']);
    expect(chatgptRow?.sentiment).toEqual({ 'chatgpt response text': 1 });

    const perplexityRow = insertedRows.find((row) => row.text === 'perplexity response text');
    expect(perplexityRow?.brand_ids_ranking).toEqual(['perplexity response text']);
    expect(perplexityRow?.sentiment).toEqual({ 'perplexity response text': 1 });

    // outcomes stay in requested-chatbotIds order, one per requested Chatbot, regardless of the
    // shorter `responses`/persisted-rows array.
    expect(outcomes.map((outcome) => outcome.chatbotId)).toEqual([
      ChatbotId.ChatGPT,
      ChatbotId.GoogleAIOverview,
      ChatbotId.Perplexity,
    ]);
  });

  it('calls only the Chatbots in an explicit chatbotIds list, and no others', async () => {
    const outcomes = await executePrompt({
      promptId: 'prompt-1',
      promptName: 'my prompt',
      projectId: PROJECT.id,
      chatbotIds: [ChatbotId.ChatGPT],
      workflowId: 'workflow-1',
    });

    expect(mockChatGPT).toHaveBeenCalledTimes(1);
    expect(mockGoogleAIMode).not.toHaveBeenCalled();
    expect(mockPerplexity).not.toHaveBeenCalled();
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].chatbotId).toBe(ChatbotId.ChatGPT);
  });

  it('yields isCompleted: false for a rejected Chatbot while its siblings still persist', async () => {
    const outcomes = await executePrompt({
      promptId: 'prompt-1',
      promptName: 'my prompt',
      projectId: PROJECT.id,
      chatbotIds: [ChatbotId.ChatGPT, ChatbotId.GoogleAIOverview, ChatbotId.Perplexity],
      workflowId: 'workflow-1',
    });

    const googleOutcome = outcomes.find(
      (outcome) => outcome.chatbotId === ChatbotId.GoogleAIOverview
    );
    expect(googleOutcome?.isCompleted).toBe(false);
    expect(googleOutcome?.attempts).toBe(1);
    expect(googleOutcome?.error).toBeTruthy();

    const chatGptOutcome = outcomes.find((outcome) => outcome.chatbotId === ChatbotId.ChatGPT);
    expect(chatGptOutcome?.isCompleted).toBe(true);
    const perplexityOutcome = outcomes.find(
      (outcome) => outcome.chatbotId === ChatbotId.Perplexity
    );
    expect(perplexityOutcome?.isCompleted).toBe(true);

    // The rejected Chatbot never reaches persistence; its siblings still do.
    expect(insertedRows).toHaveLength(2);
    expect(insertedRows.some((row) => row.text === 'chatgpt response text')).toBe(true);
    expect(insertedRows.some((row) => row.text === 'perplexity response text')).toBe(true);
  });

  it('carries the run id into both run_id and workflow_id when runId is passed', async () => {
    await executePrompt({
      promptId: 'prompt-1',
      promptName: 'my prompt',
      projectId: PROJECT.id,
      chatbotIds: [ChatbotId.ChatGPT],
      workflowId: 'run-1',
      runId: 'run-1',
    });

    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0].run_id).toBe('run-1');
    expect(insertedRows[0].workflow_id).toBe('run-1');
  });
});
