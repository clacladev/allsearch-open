import { describe, expect, it } from 'bun:test';
import { getVisibilityDataset } from '@/libs/utils/project-analysis/getVisibilityDataset';
import { CollectionGroup, PromptResponseWorkRow } from '@/libs/utils/project-analysis/helpers';
import { CHART_GAP_BREAK_MS } from '@/libs/utils/project-analysis/collectionSeries';
import { COLLECTION_CADENCE_MS } from '@/libs/collection/constants';
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

describe('getVisibilityDataset', () => {
  it('returns [] for zero groups', async () => {
    const dataset = await getVisibilityDataset(brandsIdInfoMap, []);
    expect(dataset).toEqual([]);
    expect(dataset.length > 1).toBe(false);
  });

  it('produces exactly one entry for one group, no gap entry', async () => {
    const group = makeGroup();
    const dataset = await getVisibilityDataset(brandsIdInfoMap, [group]);
    expect(dataset).toHaveLength(1);
    expect(dataset[0].isGap).toBe(false);
    expect(dataset[0].date).toBe(group.date);
    expect(dataset[0].timestamp).toBe(Date.parse(group.finishedAt));
  });

  it('inserts no gap entry when two groups are exactly 14 days apart', async () => {
    const gapMs = COLLECTION_CADENCE_MS * 2;
    expect(gapMs).toBe(CHART_GAP_BREAK_MS);
    const first = makeGroup({ runId: 'run-1', finishedAt: '2026-01-01T00:00:00.000Z', date: '2026-01-01' });
    const second = makeGroup({
      runId: 'run-2',
      finishedAt: new Date(Date.parse(first.finishedAt) + gapMs).toISOString(),
      date: '2026-01-15',
    });
    const dataset = await getVisibilityDataset(brandsIdInfoMap, [first, second]);
    expect(dataset).toHaveLength(2);
    expect(dataset.some((e) => e.isGap)).toBe(false);
  });

  it('inserts a gap entry when two groups are 14 days + 1ms apart', async () => {
    const gapMs = CHART_GAP_BREAK_MS + 1;
    const first = makeGroup({ runId: 'run-1', finishedAt: '2026-01-01T00:00:00.000Z', date: '2026-01-01' });
    const second = makeGroup({
      runId: 'run-2',
      finishedAt: new Date(Date.parse(first.finishedAt) + gapMs).toISOString(),
      date: '2026-01-15',
    });
    const dataset = await getVisibilityDataset(brandsIdInfoMap, [first, second]);
    expect(dataset).toHaveLength(3);
    expect(dataset[1].isGap).toBe(true);
    expect(dataset[1].date).toBeNull();
    expect(dataset[1]['Hoka']).toBeNull();
    expect(dataset[1]['Nike']).toBeNull();
    expect(dataset[1].timestamp).toBeGreaterThan(dataset[0].timestamp);
    expect(dataset[1].timestamp).toBeLessThan(dataset[2].timestamp);
  });

  it('computes percentages per group, not per day', async () => {
    const group = makeGroup({
      responses: [
        makeWorkRow({ id: 'r1', brand_ids_ranking: ['brand-a'] }),
        makeWorkRow({ id: 'r2', brand_ids_ranking: [] }),
      ],
    });
    const dataset = await getVisibilityDataset(brandsIdInfoMap, [group]);
    expect(dataset[0]['Hoka']).toBe('50');
  });

  it('produces a point for a fallback (run_id: null) group same as a real run', async () => {
    const group = makeGroup({ runId: null });
    const dataset = await getVisibilityDataset(brandsIdInfoMap, [group]);
    expect(dataset).toHaveLength(1);
    expect(dataset[0].isGap).toBe(false);
  });

  it('emits points ascending by timestamp', async () => {
    const first = makeGroup({ runId: 'run-1', finishedAt: '2026-01-01T00:00:00.000Z', date: '2026-01-01' });
    const second = makeGroup({ runId: 'run-2', finishedAt: '2026-01-05T00:00:00.000Z', date: '2026-01-05' });
    const dataset = await getVisibilityDataset(brandsIdInfoMap, [first, second]);
    expect(dataset[0].timestamp).toBeLessThan(dataset[1].timestamp);
  });
});
