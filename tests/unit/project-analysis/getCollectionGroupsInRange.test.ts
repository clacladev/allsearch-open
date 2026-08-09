import { describe, expect, it } from 'bun:test';
import { getCollectionGroupsInRange } from '@/libs/utils/project-analysis/collectionSeries';
import { PromptResponseWorkRow } from '@/libs/utils/project-analysis/helpers';
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

describe('getCollectionGroupsInRange', () => {
  it('returns [] for empty input', () => {
    expect(getCollectionGroupsInRange([], '2026-01-01', '2026-01-31')).toEqual([]);
  });

  it('collapses responses sharing a run_id into one group; different run_ids stay separate', () => {
    const responses = [
      makeWorkRow({
        id: 'r1',
        run_id: 'run-1',
        created_at: '2026-01-05T10:00:00.000Z',
        created_at_iso_date: '2026-01-05',
      }),
      makeWorkRow({
        id: 'r2',
        run_id: 'run-1',
        created_at: '2026-01-05T12:00:00.000Z',
        created_at_iso_date: '2026-01-05',
      }),
      makeWorkRow({
        id: 'r3',
        run_id: 'run-2',
        created_at: '2026-01-10T10:00:00.000Z',
        created_at_iso_date: '2026-01-10',
      }),
    ];
    const groups = getCollectionGroupsInRange(responses, '2026-01-01', '2026-01-31');
    expect(groups).toHaveLength(2);
    expect(groups[0].runId).toBe('run-1');
    expect(groups[0].responses).toHaveLength(2);
    expect(groups[1].runId).toBe('run-2');
    expect(groups[1].responses).toHaveLength(1);
  });

  it('groups run_id: null responses by ISO day, with runId null, keeping a same-day real run separate', () => {
    const responses = [
      makeWorkRow({
        id: 'r1',
        run_id: null,
        created_at: '2026-01-05T08:00:00.000Z',
        created_at_iso_date: '2026-01-05',
      }),
      makeWorkRow({
        id: 'r2',
        run_id: null,
        created_at: '2026-01-05T09:00:00.000Z',
        created_at_iso_date: '2026-01-05',
      }),
      makeWorkRow({
        id: 'r3',
        run_id: 'run-1',
        created_at: '2026-01-05T10:00:00.000Z',
        created_at_iso_date: '2026-01-05',
      }),
    ];
    const groups = getCollectionGroupsInRange(responses, '2026-01-01', '2026-01-31');
    expect(groups).toHaveLength(2);
    const nullGroup = groups.find((g) => g.runId === null);
    const runGroup = groups.find((g) => g.runId === 'run-1');
    expect(nullGroup).toBeDefined();
    expect(nullGroup!.responses).toHaveLength(2);
    expect(runGroup).toBeDefined();
    expect(runGroup!.responses).toHaveLength(1);
  });

  it('sorts ascending by finishedAt regardless of input order', () => {
    const early = makeWorkRow({
      id: 'r1',
      run_id: 'run-1',
      created_at: '2026-01-02T08:00:00.000Z',
      created_at_iso_date: '2026-01-02',
    });
    const late = makeWorkRow({
      id: 'r2',
      run_id: 'run-2',
      created_at: '2026-01-20T08:00:00.000Z',
      created_at_iso_date: '2026-01-20',
    });
    const groups = getCollectionGroupsInRange([late, early], '2026-01-01', '2026-01-31');
    expect(groups.map((g) => g.runId)).toEqual(['run-1', 'run-2']);
  });

  it('date-stamps a midnight-straddling run by its newest response', () => {
    const responses = [
      makeWorkRow({
        id: 'r1',
        run_id: 'run-1',
        created_at: '2026-01-05T23:50:00.000Z',
        created_at_iso_date: '2026-01-05',
      }),
      makeWorkRow({
        id: 'r2',
        run_id: 'run-1',
        created_at: '2026-01-06T00:10:00.000Z',
        created_at_iso_date: '2026-01-06',
      }),
    ];
    const groups = getCollectionGroupsInRange(responses, '2026-01-01', '2026-01-31');
    expect(groups).toHaveLength(1);
    expect(groups[0].date).toBe('2026-01-06');
    expect(groups[0].finishedAt).toBe('2026-01-06T00:10:00.000Z');
  });

  it('filters inclusively at both range ends', () => {
    const responses = [
      makeWorkRow({
        id: 'r1',
        run_id: 'run-start',
        created_at: '2026-01-01T08:00:00.000Z',
        created_at_iso_date: '2026-01-01',
      }),
      makeWorkRow({
        id: 'r2',
        run_id: 'run-end',
        created_at: '2026-01-31T08:00:00.000Z',
        created_at_iso_date: '2026-01-31',
      }),
      makeWorkRow({
        id: 'r3',
        run_id: 'run-before',
        created_at: '2025-12-31T08:00:00.000Z',
        created_at_iso_date: '2025-12-31',
      }),
      makeWorkRow({
        id: 'r4',
        run_id: 'run-after',
        created_at: '2026-02-01T08:00:00.000Z',
        created_at_iso_date: '2026-02-01',
      }),
    ];
    const groups = getCollectionGroupsInRange(responses, '2026-01-01', '2026-01-31');
    expect(groups.map((g) => g.runId)).toEqual(['run-start', 'run-end']);
  });
});
