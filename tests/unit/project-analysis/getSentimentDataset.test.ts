import { describe, expect, it } from 'bun:test';
import { getSentimentDataset } from '@/libs/utils/project-analysis/getSentimentDataset';
import { CollectionGroup, PromptResponseWorkRow } from '@/libs/utils/project-analysis/helpers';
import { CHART_GAP_BREAK_MS } from '@/libs/utils/project-analysis/collectionSeries';
import { BrandInfo } from '@/libs/utils/project-analysis/types';
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

function makeGroup(overrides: Partial<CollectionGroup> = {}): CollectionGroup {
  return {
    runId: 'run-1',
    date: '2026-01-01',
    finishedAt: '2026-01-01T10:00:00.000Z',
    responses: [makeWorkRow()],
    ...overrides,
  };
}

const brandsIdInfoMap = new Map<string, BrandInfo>([
  ['brand-a', { brandId: 'brand-a', label: 'Hoka', isProject: true }],
  ['brand-b', { brandId: 'brand-b', label: 'Nike', isProject: false }],
]);

describe('getSentimentDataset', () => {
  it('returns [] for zero groups', async () => {
    const dataset = await getSentimentDataset(brandsIdInfoMap, []);
    expect(dataset).toEqual([]);
  });

  it('produces exactly one entry for one group', async () => {
    const group = makeGroup();
    const dataset = await getSentimentDataset(brandsIdInfoMap, [group]);
    expect(dataset).toHaveLength(1);
    expect(dataset[0].isGap).toBe(false);
    expect(dataset[0].date).toBe(group.date);
    expect(dataset[0].timestamp).toBe(Date.parse(group.finishedAt));
  });

  it('inserts no gap entry exactly at 14 days', async () => {
    const first = makeGroup({ runId: 'run-1', finishedAt: '2026-01-01T00:00:00.000Z', date: '2026-01-01' });
    const second = makeGroup({
      runId: 'run-2',
      finishedAt: new Date(Date.parse(first.finishedAt) + CHART_GAP_BREAK_MS).toISOString(),
      date: '2026-01-15',
    });
    const dataset = await getSentimentDataset(brandsIdInfoMap, [first, second]);
    expect(dataset).toHaveLength(2);
    expect(dataset.some((e) => e.isGap)).toBe(false);
  });

  it('inserts a gap entry at 14 days + 1ms', async () => {
    const first = makeGroup({ runId: 'run-1', finishedAt: '2026-01-01T00:00:00.000Z', date: '2026-01-01' });
    const second = makeGroup({
      runId: 'run-2',
      finishedAt: new Date(Date.parse(first.finishedAt) + CHART_GAP_BREAK_MS + 1).toISOString(),
      date: '2026-01-15',
    });
    const dataset = await getSentimentDataset(brandsIdInfoMap, [first, second]);
    expect(dataset).toHaveLength(3);
    expect(dataset[1].isGap).toBe(true);
    expect(dataset[1].date).toBeNull();
    expect(dataset[1]['Hoka']).toBeNull();
  });

  it('produces a point for a fallback (run_id: null) group', async () => {
    const group = makeGroup({ runId: null });
    const dataset = await getSentimentDataset(brandsIdInfoMap, [group]);
    expect(dataset).toHaveLength(1);
    expect(dataset[0].isGap).toBe(false);
  });

  it('emits points ascending by timestamp', async () => {
    const first = makeGroup({ runId: 'run-1', finishedAt: '2026-01-01T00:00:00.000Z', date: '2026-01-01' });
    const second = makeGroup({ runId: 'run-2', finishedAt: '2026-01-05T00:00:00.000Z', date: '2026-01-05' });
    const dataset = await getSentimentDataset(brandsIdInfoMap, [first, second]);
    expect(dataset[0].timestamp).toBeLessThan(dataset[1].timestamp);
  });

  it('averages sentiment per group', async () => {
    const group = makeGroup({
      responses: [
        makeWorkRow({ id: 'r1', sentiment: { 'brand-a': 1 } }),
        makeWorkRow({ id: 'r2', sentiment: { 'brand-a': 2 } }),
      ],
    });
    const dataset = await getSentimentDataset(brandsIdInfoMap, [group]);
    expect(dataset[0]['Hoka']).toBe('1.5');
  });

  it('defaults a brand with no sentiment in a real group to "0.0", not null', async () => {
    const group = makeGroup({
      responses: [makeWorkRow({ id: 'r1', sentiment: { 'brand-a': 1 } })],
    });
    const dataset = await getSentimentDataset(brandsIdInfoMap, [group]);
    expect(dataset[0]['Nike']).toBe('0.0');
  });
});
