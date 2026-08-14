import { mock } from 'bun:test';

import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import { mockModuleForSuite } from '../moduleMocks';

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

// `mockModuleForSuite` (rather than a raw `mock.module`) throughout this file: Bun's module
// registry is process-wide and `mock.restore()` does not undo `mock.module`, so every stub below
// would otherwise stay live for the rest of the test run — see tests/unit/moduleMocks.ts.
//
// Each partial stub still spreads the real namespace the helper hands it, because `mock.module`
// swaps the whole export namespace: a stub exporting only `getProjectRowWithId` would make
// `getProjectRows` and `updateProjectRow` cease to exist for any other module linked against this
// one while the stub is installed. `getProjectRowWithId` also short-circuits only for this file's
// own fixture id, so a real, DB-backed Project never reads as missing.
await mockModuleForSuite<typeof import('@/libs/database/Projects/queries')>(
  '@/libs/database/Projects/queries',
  (actual) => ({
    ...actual,
    getProjectRowWithId: async (id: string) =>
      id === PROJECT.id ? PROJECT : actual.getProjectRowWithId(id),
  })
);
await mockModuleForSuite<typeof import('@/libs/database/Competitors/queries')>(
  '@/libs/database/Competitors/queries',
  (actual) => ({
    ...actual,
    getActiveCompetitorRowsWithProjectId: async () => [],
  })
);

// Records every row `storePromptResponses` (a private function in the module under test) attempts
// to insert, so tests can assert brand_ids_ranking/sentiment/run_id stayed positionally
// aligned to the response each row came from.
let insertedRows: Array<{
  text: string;
  brand_ids_ranking: string[];
  sentiment: unknown;
  run_id: string | null;
}> = [];
await mockModuleForSuite<typeof import('@/libs/database/PromptResponses/queries')>(
  '@/libs/database/PromptResponses/queries',
  (actual) => ({
    ...actual,
    insertPromptResponseRows: mock(async (inputs: any[]) => {
      insertedRows = inputs;
      return inputs.map((input, index) => ({ ...input, id: `row-${index}` }));
    }),
  })
);
await mockModuleForSuite<typeof import('@/libs/database/Sources/queries')>(
  '@/libs/database/Sources/queries',
  (actual) => ({
    ...actual,
    insertSourceRows: mock(async () => []),
  })
);

// One mock per Chatbot's AI call so a test can assert only the requested Chatbots are ever called.
const mockChatGPT = mock(async () => ({
  response: { modelId: 'chatgpt-model' },
  text: 'chatgpt response text',
  sources: [],
  toolResults: [],
}));
// Google's behaviour varies per test (down, ungrounded, healthy), so the mock delegates to a
// swappable implementation that `beforeEach` puts back to the default — `mockClear()` resets call
// records but not the implementation, and this file's mocks are installed once at module scope.
const defaultGoogleAIModeImpl = async () => {
  throw new Error('Google AI Mode is down');
};
let googleAIModeImpl: () => Promise<unknown> = defaultGoogleAIModeImpl;
const mockGoogleAIMode = mock(async () => googleAIModeImpl());
const mockPerplexity = mock(async () => ({
  response: { modelId: 'perplexity-model' },
  text: 'perplexity response text',
  sources: [],
  toolResults: [],
}));
await mockModuleForSuite('@/libs/ai/projectPrompt/getPromptResponseWithChatGPT', () => ({
  getPromptResponseWithChatGPT: mockChatGPT,
}));
await mockModuleForSuite('@/libs/ai/projectPrompt/getPromptResponseWithGoogleAIMode', () => ({
  getPromptResponseWithGoogleAIMode: mockGoogleAIMode,
}));
await mockModuleForSuite('@/libs/ai/projectPrompt/getPromptResponseWithPerplexity', () => ({
  getPromptResponseWithPerplexity: mockPerplexity,
}));

// Distinguishing, deterministic stand-ins for the real analysis functions: each echoes back
// something derived from the response text it was given, so a test can tell which response a
// stored row's ranking/sentiment actually came from.
await mockModuleForSuite('@/libs/ai/sentimentAnalysis', (actual) => ({
  ...actual,
  analyzeResponseSentiment: mock(async (text: string) => ({ [text]: 1 })),
}));
await mockModuleForSuite('@/libs/utils/brandIdsRanking', (actual) => ({
  ...actual,
  getBrandIdsRankingsInText: mock((text: string) => [text]),
}));
await mockModuleForSuite('@/libs/collection/analyseSources', (actual) => ({
  ...actual,
  analysePromptResponseSources: async () => [],
}));

import { beforeEach, describe, expect, it } from 'bun:test';
import { UngroundedResponseError } from '@/libs/ai/grounding';
import { MAX_ITEM_ATTEMPTS } from '@/libs/collection/constants';
import { executePrompt } from '@/libs/collection/executePrompt';
import { clearProviderCooldowns } from '@/libs/collection/providerCooldown';

beforeEach(() => {
  // `providerCooldown` is a module-level singleton shared by every caller of `callAiWithRetry` in
  // the test process; a cooldown left open by another suite (e.g. tests/unit/collection/callAi.test.ts)
  // would otherwise make this file's real, uninjected `sleep` wait it out.
  clearProviderCooldowns();
  insertedRows = [];
  googleAIModeImpl = defaultGoogleAIModeImpl;
  mockChatGPT.mockClear();
  mockGoogleAIMode.mockClear();
  mockPerplexity.mockClear();
});

// Never aborted — these tests exercise ordinary completion/failure paths, not cancellation
// (that is `tests/unit/collection/callAi.test.ts` and the `runLoop.ts` cancellation suite).
const signal = new AbortController().signal;

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
      runId: 'run-1',
      signal,
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
      runId: 'run-1',
      signal,
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
      runId: 'run-1',
      signal,
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

  it('never stores an ungrounded Google response, and reports it failed after bounded retries', async () => {
    // Issue 25: the model answered from training data instead of searching. The text is long and
    // fluent, so nothing downstream would flag it — the only defence is refusing to persist it.
    googleAIModeImpl = async () => {
      throw new UngroundedResponseError('gemini-3.1-flash-lite');
    };

    const outcomes = await executePrompt({
      promptId: 'prompt-1',
      promptName: 'my prompt',
      projectId: PROJECT.id,
      chatbotIds: [ChatbotId.ChatGPT, ChatbotId.GoogleAIOverview],
      runId: 'run-1',
      signal,
    });

    const googleOutcome = outcomes.find(
      (outcome) => outcome.chatbotId === ChatbotId.GoogleAIOverview
    );
    expect(googleOutcome?.isCompleted).toBe(false);
    expect(googleOutcome?.attempts).toBe(MAX_ITEM_ATTEMPTS);
    expect(googleOutcome?.error).toContain('without searching the web');
    expect(mockGoogleAIMode).toHaveBeenCalledTimes(MAX_ITEM_ATTEMPTS);

    // Only ChatGPT's row is persisted — no Prompt Response, and therefore no Visibility
    // contribution, comes from the ungrounded answer.
    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0].text).toBe('chatgpt response text');
  });

  it('stores a Google response that grounded on a retry', async () => {
    let attempts = 0;
    googleAIModeImpl = async () => {
      attempts += 1;
      if (attempts === 1) throw new UngroundedResponseError('gemini-3.1-flash-lite');
      return {
        response: { modelId: 'google-model' },
        text: 'grounded google response text',
        sources: [],
        toolResults: [],
      };
    };

    const outcomes = await executePrompt({
      promptId: 'prompt-1',
      promptName: 'my prompt',
      projectId: PROJECT.id,
      chatbotIds: [ChatbotId.GoogleAIOverview],
      runId: 'run-1',
      signal,
    });

    expect(outcomes[0].isCompleted).toBe(true);
    expect(outcomes[0].attempts).toBe(2);
    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0].text).toBe('grounded google response text');
  });

  it('carries the run id into run_id', async () => {
    await executePrompt({
      promptId: 'prompt-1',
      promptName: 'my prompt',
      projectId: PROJECT.id,
      chatbotIds: [ChatbotId.ChatGPT],
      runId: 'run-1',
      signal,
    });

    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0].run_id).toBe('run-1');
  });
});
