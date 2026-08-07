import { describe, expect, it } from 'bun:test';
import {
  getLatestCollectionGroup,
  PromptResponseWorkRow,
} from '@/libs/utils/project-analysis/helpers';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';

function makeWorkRow(
  overrides: Partial<PromptResponseWorkRow> = {}
): PromptResponseWorkRow {
  return {
    id: 'response-1',
    sources: [],
    brand_ids_ranking: [],
    sentiment: null,
    chatbot_id: ChatbotId.ChatGPT,
    prompt_id: 'prompt-1',
    created_at: '2026-01-01T00:00:00.000Z',
    run_id: null,
    key: '2026-01-01-prompt-1-chatgpt',
    created_at_iso_date: '2026-01-01',
    ...overrides,
  };
}

describe('getLatestCollectionGroup', () => {
  it('returns null for empty input', () => {
    expect(getLatestCollectionGroup([])).toBeNull();
  });

  it('returns a group holding the single response, stamped by its run id and date', () => {
    const row = makeWorkRow({
      id: 'r1',
      run_id: 'run-1',
      created_at: '2026-01-02T10:00:00.000Z',
      created_at_iso_date: '2026-01-02',
    });
    const group = getLatestCollectionGroup([row]);
    expect(group).not.toBeNull();
    expect(group!.runId).toBe('run-1');
    expect(group!.date).toBe('2026-01-02');
    expect(group!.responses).toHaveLength(1);
    expect(group!.responses[0].id).toBe('r1');
  });

  it('groups multiple responses in one Run by run_id', () => {
    const responses = [
      makeWorkRow({
        id: 'r1',
        run_id: 'run-1',
        prompt_id: 'prompt-1',
        created_at: '2026-01-02T10:00:00.000Z',
        created_at_iso_date: '2026-01-02',
      }),
      makeWorkRow({
        id: 'r2',
        run_id: 'run-1',
        prompt_id: 'prompt-2',
        created_at: '2026-01-02T12:00:00.000Z',
        created_at_iso_date: '2026-01-02',
      }),
    ];
    const group = getLatestCollectionGroup(responses);
    expect(group).not.toBeNull();
    expect(group!.runId).toBe('run-1');
    expect(group!.date).toBe('2026-01-02');
    expect(group!.responses).toHaveLength(2);
  });

  it('date-stamps a midnight-straddling Run by its newest response', () => {
    // Same run, two responses across midnight: 23:50 on day 1, 00:10 on day 2.
    const responses = [
      makeWorkRow({
        id: 'r1',
        run_id: 'run-1',
        created_at: '2026-01-01T23:50:00.000Z',
        created_at_iso_date: '2026-01-01',
      }),
      makeWorkRow({
        id: 'r2',
        run_id: 'run-1',
        created_at: '2026-01-02T00:10:00.000Z',
        created_at_iso_date: '2026-01-02',
      }),
    ];
    const group = getLatestCollectionGroup(responses);
    expect(group).not.toBeNull();
    expect(group!.runId).toBe('run-1');
    expect(group!.date).toBe('2026-01-02');
    expect(group!.responses).toHaveLength(2);
  });

  it('groups NULL run_id responses by ISO day with a null runId', () => {
    const responses = [
      makeWorkRow({
        id: 'r1',
        run_id: null,
        prompt_id: 'prompt-1',
        created_at: '2026-01-03T08:00:00.000Z',
        created_at_iso_date: '2026-01-03',
      }),
      makeWorkRow({
        id: 'r2',
        run_id: null,
        prompt_id: 'prompt-2',
        created_at: '2026-01-03T10:00:00.000Z',
        created_at_iso_date: '2026-01-03',
      }),
    ];
    const group = getLatestCollectionGroup(responses);
    expect(group).not.toBeNull();
    expect(group!.runId).toBeNull();
    expect(group!.date).toBe('2026-01-03');
    expect(group!.responses).toHaveLength(2);
  });

  it('keeps NULL and non-NULL run_id responses in separate groups, latest chosen by newestCreatedAt', () => {
    // A run with a NULL run_id but a newer created_at must win over a dated run.
    const runGroup = [
      makeWorkRow({
        id: 'r1',
        run_id: 'run-1',
        created_at: '2026-01-01T08:00:00.000Z',
        created_at_iso_date: '2026-01-01',
      }),
    ];
    const nullGroup = [
      makeWorkRow({
        id: 'r2',
        run_id: null,
        created_at: '2026-01-02T08:00:00.000Z',
        created_at_iso_date: '2026-01-02',
      }),
    ];
    const group = getLatestCollectionGroup([...runGroup, ...nullGroup]);
    expect(group).not.toBeNull();
    expect(group!.runId).toBeNull();
    expect(group!.date).toBe('2026-01-02');
    expect(group!.responses).toHaveLength(1);
    expect(group!.responses[0].id).toBe('r2');
  });

  it('selects the group with the newest created_at regardless of input order', () => {
    // Same set as the NULL/non-NULL case, but scrambled so a buggy implementation that
    // picked its group by array position would return the wrong group.
    const ordered = [
      makeWorkRow({
        id: 'r1',
        run_id: 'run-1',
        created_at: '2026-01-01T08:00:00.000Z',
        created_at_iso_date: '2026-01-01',
      }),
      makeWorkRow({
        id: 'r2',
        run_id: null,
        created_at: '2026-01-02T08:00:00.000Z',
        created_at_iso_date: '2026-01-02',
      }),
    ];
    const scrambled = [
      ordered[1],
      // interleave an older row that must not win
      makeWorkRow({
        id: 'r0',
        run_id: 'run-old',
        created_at: '2025-12-31T08:00:00.000Z',
        created_at_iso_date: '2025-12-31',
      }),
      ordered[0],
    ];

    const baseline = getLatestCollectionGroup(ordered);
    const flipped = getLatestCollectionGroup(scrambled);

    expect(baseline).not.toBeNull();
    expect(flipped).not.toBeNull();
    expect(flipped!.runId).toBe(baseline!.runId);
    expect(flipped!.date).toBe(baseline!.date);
    expect(flipped!.responses).toHaveLength(baseline!.responses.length);
    // The newest row (r2, 2026-01-02) wins either way.
    expect(flipped!.runId).toBeNull();
    expect(flipped!.date).toBe('2026-01-02');
  });
});