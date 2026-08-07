import { describe, expect, it } from 'bun:test';
import { getPromptResponsesWorkRows } from '@/libs/utils/project-analysis/helpers';
import { PromptResponseSummaryRow } from '@/libs/database/PromptResponses/types';
import { SourceRow } from '@/libs/database/Sources/types';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';

function makeSummaryRow(
  overrides: Partial<PromptResponseSummaryRow> = {}
): PromptResponseSummaryRow {
  return {
    id: 'response-1',
    brand_ids_ranking: [],
    sentiment: null,
    chatbot_id: ChatbotId.ChatGPT,
    prompt_id: 'prompt-1',
    created_at: '2026-01-01T12:00:00.000Z',
    run_id: null,
    ...overrides,
  };
}

function makeSourceRow(overrides: Partial<SourceRow> = {}): SourceRow {
  return {
    id: 'source-1',
    created_at: '2026-01-01T12:00:00.000Z',
    project_id: 'project-1',
    prompt_id: 'prompt-1',
    prompt_response_id: 'response-1',
    is_cited: true,
    position: 0,
    clean_url: 'example.com/page',
    url: 'https://example.com/page',
    hostname: 'example.com',
    raw_url: null,
    title: null,
    description: null,
    headings: null,
    brand_ids_ranking: [],
    ...overrides,
  };
}

describe('getPromptResponsesWorkRows', () => {
  it('returns empty array for empty input', () => {
    expect(getPromptResponsesWorkRows([], [])).toEqual([]);
  });

  it('adds key and created_at_iso_date fields', () => {
    const rows = [makeSummaryRow()];
    const result = getPromptResponsesWorkRows(rows, []);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('2026-01-01-prompt-1-chatgpt');
    expect(result[0].created_at_iso_date).toBe('2026-01-01');
  });

  it('keeps all responses for different prompts on the same day', () => {
    const rows = [
      makeSummaryRow({ id: 'r1', prompt_id: 'prompt-1' }),
      makeSummaryRow({ id: 'r2', prompt_id: 'prompt-2' }),
    ];
    const result = getPromptResponsesWorkRows(rows, []);
    expect(result).toHaveLength(2);
  });

  it('keeps all responses for different chatbots on the same day', () => {
    const rows = [
      makeSummaryRow({ id: 'r1', chatbot_id: ChatbotId.ChatGPT }),
      makeSummaryRow({ id: 'r2', chatbot_id: ChatbotId.Perplexity }),
      makeSummaryRow({ id: 'r3', chatbot_id: ChatbotId.GoogleAIOverview }),
    ];
    const result = getPromptResponsesWorkRows(rows, []);
    expect(result).toHaveLength(3);
  });

  it('keeps all responses for same prompt+chatbot on different days', () => {
    const rows = [
      makeSummaryRow({ id: 'r1', created_at: '2026-01-01T12:00:00.000Z' }),
      makeSummaryRow({ id: 'r2', created_at: '2026-01-02T12:00:00.000Z' }),
    ];
    const result = getPromptResponsesWorkRows(rows, []);
    expect(result).toHaveLength(2);
  });

  it('deduplicates same prompt+chatbot+day, keeping the last one', () => {
    const rows = [
      makeSummaryRow({
        id: 'r-earlier',
        created_at: '2026-01-01T08:00:00.000Z',
        brand_ids_ranking: ['old'],
      }),
      makeSummaryRow({
        id: 'r-later',
        created_at: '2026-01-01T16:00:00.000Z',
        brand_ids_ranking: ['new'],
      }),
    ];
    const result = getPromptResponsesWorkRows(rows, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r-later');
    expect(result[0].brand_ids_ranking).toEqual(['new']);
  });

  it('populates sources from source rows', () => {
    const rows = [makeSummaryRow({ id: 'r1' })];
    const sourceRows = [
      makeSourceRow({
        prompt_response_id: 'r1',
        is_cited: true,
        position: 0,
        clean_url: 'example.com/page',
        url: 'https://example.com/page',
        hostname: 'example.com',
        title: 'Test',
      }),
    ];
    const result = getPromptResponsesWorkRows(rows, sourceRows);
    expect(result[0].sources).toEqual([
      {
        isCited: true,
        url: 'https://example.com/page',
        cleanUrl: 'example.com/page',
        hostname: 'example.com',
        title: 'Test',
        rawUrl: undefined,
        description: undefined,
        headings: undefined,
        brandIdsRanking: undefined,
      },
    ]);
  });

  it('orders sources by position', () => {
    const rows = [makeSummaryRow({ id: 'r1' })];
    const sourceRows = [
      makeSourceRow({ prompt_response_id: 'r1', position: 1, clean_url: 'b.com/page' }),
      makeSourceRow({ prompt_response_id: 'r1', position: 0, clean_url: 'a.com/page' }),
    ];
    const result = getPromptResponsesWorkRows(rows, sourceRows);
    expect(result[0].sources[0].cleanUrl).toBe('a.com/page');
    expect(result[0].sources[1].cleanUrl).toBe('b.com/page');
  });

  it('handles mixed dedup scenario correctly', () => {
    const rows = [
      // Day 1: two responses for prompt-1/chatgpt (should dedup to last)
      makeSummaryRow({
        id: 'r1',
        prompt_id: 'prompt-1',
        chatbot_id: ChatbotId.ChatGPT,
        created_at: '2026-01-01T08:00:00.000Z',
      }),
      makeSummaryRow({
        id: 'r2',
        prompt_id: 'prompt-1',
        chatbot_id: ChatbotId.ChatGPT,
        created_at: '2026-01-01T16:00:00.000Z',
      }),
      // Day 1: one response for prompt-1/perplexity (should keep)
      makeSummaryRow({
        id: 'r3',
        prompt_id: 'prompt-1',
        chatbot_id: ChatbotId.Perplexity,
        created_at: '2026-01-01T12:00:00.000Z',
      }),
      // Day 2: one response for prompt-1/chatgpt (should keep)
      makeSummaryRow({
        id: 'r4',
        prompt_id: 'prompt-1',
        chatbot_id: ChatbotId.ChatGPT,
        created_at: '2026-01-02T12:00:00.000Z',
      }),
    ];
    const result = getPromptResponsesWorkRows(rows, []);
    expect(result).toHaveLength(3);

    const ids = result.map((r) => r.id);
    expect(ids).toContain('r2'); // kept (latest of day1 chatgpt)
    expect(ids).toContain('r3'); // kept (different chatbot)
    expect(ids).toContain('r4'); // kept (different day)
    expect(ids).not.toContain('r1'); // deduped
  });
});
