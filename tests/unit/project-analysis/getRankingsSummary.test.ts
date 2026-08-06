import { describe, expect, it } from 'bun:test';
import { getRankingsSummary } from '@/libs/utils/project-analysis/getRankingsSummary';
import { BrandInfo } from '@/libs/utils/project-analysis/types';
import { PromptResponseWorkRow } from '@/libs/utils/project-analysis/helpers';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';

function makeBrandInfo(overrides: Partial<BrandInfo> = {}): BrandInfo {
  return {
    brandId: 'brand-1',
    label: 'Brand One',
    isProject: true,
    ...overrides,
  };
}

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

describe('getRankingsSummary', () => {
  it('returns an empty array when there are no prompt responses', async () => {
    const brands = new Map([['brand-1', makeBrandInfo()]]);
    const result = await getRankingsSummary(brands, []);
    expect(result).toEqual([]);
  });

  it('only considers responses from the latest date', async () => {
    const brandA = makeBrandInfo({ brandId: 'brand-a', label: 'A' });
    const brandB = makeBrandInfo({ brandId: 'brand-b', label: 'B', isProject: false });
    const brands = new Map([
      ['brand-a', brandA],
      ['brand-b', brandB],
    ]);

    const responses = [
      // Old date: brand-b wins
      makeWorkRow({
        id: 'r1',
        created_at: '2026-01-01T10:00:00.000Z',
        created_at_iso_date: '2026-01-01',
        brand_ids_ranking: ['brand-b', 'brand-a'],
      }),
      // Latest date: brand-a wins
      makeWorkRow({
        id: 'r2',
        created_at: '2026-01-02T10:00:00.000Z',
        created_at_iso_date: '2026-01-02',
        brand_ids_ranking: ['brand-a', 'brand-b'],
      }),
    ];

    const result = await getRankingsSummary(brands, responses);
    // brand-a should rank first (lower sum = better)
    expect(result[0].brandId).toBe('brand-a');
    expect(result[1].brandId).toBe('brand-b');
  });

  it('ranks brands by sum of their positions (lower sum wins)', async () => {
    const brandA = makeBrandInfo({ brandId: 'brand-a', label: 'A' });
    const brandB = makeBrandInfo({ brandId: 'brand-b', label: 'B', isProject: false });
    const brands = new Map([
      ['brand-a', brandA],
      ['brand-b', brandB],
    ]);

    const responses = [
      makeWorkRow({
        id: 'r1',
        brand_ids_ranking: ['brand-b', 'brand-a'], // brand-b at index 0, brand-a at index 1
      }),
      makeWorkRow({
        id: 'r2',
        brand_ids_ranking: ['brand-b', 'brand-a'], // brand-b at index 0, brand-a at index 1
      }),
    ];

    const result = await getRankingsSummary(brands, responses);
    expect(result[0].brandId).toBe('brand-b');
    expect(result[1].brandId).toBe('brand-a');
  });

  it('applies a penalty for brands missing from a response', async () => {
    // If a brand is missing from a response, it gets penalty = (total responses + 1) per missing response
    const brandA = makeBrandInfo({ brandId: 'brand-a', label: 'A' });
    const brandB = makeBrandInfo({ brandId: 'brand-b', label: 'B', isProject: false });
    const brands = new Map([
      ['brand-a', brandA],
      ['brand-b', brandB],
    ]);

    const responses = [
      // brand-a ranks at index 0, brand-b not present (gets penalty of 2 responses + 1 = 3)
      makeWorkRow({ id: 'r1', brand_ids_ranking: ['brand-a'] }),
      makeWorkRow({ id: 'r2', brand_ids_ranking: ['brand-a'] }),
    ];

    const result = await getRankingsSummary(brands, responses);
    // brand-a sum: 0+0=0, brand-b sum: 0+3+3=6 (missing penalty twice)
    expect(result[0].brandId).toBe('brand-a');
    expect(result[1].brandId).toBe('brand-b');
  });

  it('returns brands in order even when all have the same score', async () => {
    const brandA = makeBrandInfo({ brandId: 'brand-a', label: 'A' });
    const brandB = makeBrandInfo({ brandId: 'brand-b', label: 'B', isProject: false });
    const brands = new Map([
      ['brand-a', brandA],
      ['brand-b', brandB],
    ]);

    // Both missing from all responses — equal penalty scores
    const responses = [makeWorkRow({ brand_ids_ranking: [] })];

    const result = await getRankingsSummary(brands, responses);
    expect(result).toHaveLength(2);
  });

  it('uses only the latest collection group regardless of array order', async () => {
    const brandA = makeBrandInfo({ brandId: 'brand-a', label: 'A' });
    const brandB = makeBrandInfo({ brandId: 'brand-b', label: 'B', isProject: false });
    const brands = new Map([
      ['brand-a', brandA],
      ['brand-b', brandB],
    ]);

    const responses = [
      // Newest row first — the DB returns rows DESC by created_at. Latest group: brand-a wins.
      makeWorkRow({
        id: 'r2',
        created_at: '2026-01-03T10:00:00.000Z',
        created_at_iso_date: '2026-01-03',
        brand_ids_ranking: ['brand-a', 'brand-b'],
      }),
      // Older row, last in the array. If a buggy implementation picked the group matching the
      // last array element's date instead of the chronologically latest one, brand-b would win.
      makeWorkRow({
        id: 'r1',
        created_at: '2026-01-01T10:00:00.000Z',
        created_at_iso_date: '2026-01-01',
        brand_ids_ranking: ['brand-b', 'brand-a'],
      }),
    ];

    const result = await getRankingsSummary(brands, responses);
    // Only the latest date (2026-01-03) is used — brand-a wins there.
    expect(result.map((b) => b.brandId)).toEqual(['brand-a', 'brand-b']);
  });

  it('describes the latest run even when it is nine days old and nothing came after it', async () => {
    const brandA = makeBrandInfo({ brandId: 'brand-a', label: 'A' });
    const brandB = makeBrandInfo({ brandId: 'brand-b', label: 'B', isProject: false });
    const brands = new Map([
      ['brand-a', brandA],
      ['brand-b', brandB],
    ]);

    const responses = [
      // Newest first — the DB returns rows DESC by created_at. Stale (latest) run has a single
      // response that favors brand-a.
      makeWorkRow({
        id: 'r2',
        run_id: 'run-stale',
        created_at: '2026-01-01T10:00:00.000Z',
        created_at_iso_date: '2026-01-01',
        brand_ids_ranking: ['brand-a', 'brand-b'],
      }),
      // Older run has two responses that, taken together, favor brand-b. A buggy implementation
      // that isolated a group by array position/date instead of the chronologically latest run
      // would pick this older run's two votes over the stale run's one, flipping the winner.
      makeWorkRow({
        id: 'r1',
        prompt_id: 'prompt-1',
        run_id: 'run-older',
        created_at: '2025-12-23T10:00:00.000Z',
        created_at_iso_date: '2025-12-23',
        brand_ids_ranking: ['brand-b', 'brand-a'],
      }),
      makeWorkRow({
        id: 'r1b',
        prompt_id: 'prompt-2',
        run_id: 'run-older',
        created_at: '2025-12-23T10:05:00.000Z',
        created_at_iso_date: '2025-12-23',
        brand_ids_ranking: ['brand-b', 'brand-a'],
      }),
    ];

    const result = await getRankingsSummary(brands, responses);
    expect(result.map((b) => b.brandId)).toEqual(['brand-a', 'brand-b']);
  });

  it('picks the later run when two runs share the same day', async () => {
    const brandA = makeBrandInfo({ brandId: 'brand-a', label: 'A' });
    const brandB = makeBrandInfo({ brandId: 'brand-b', label: 'B', isProject: false });
    const brands = new Map([
      ['brand-a', brandA],
      ['brand-b', brandB],
    ]);

    const responses = [
      // Newest first — the DB returns rows DESC by created_at.
      makeWorkRow({
        id: 'r2',
        run_id: 'run-evening',
        created_at: '2026-01-02T16:00:00.000Z',
        created_at_iso_date: '2026-01-02',
        brand_ids_ranking: ['brand-a', 'brand-b'],
      }),
      // Morning run has two responses that, taken together, favor brand-b. A buggy implementation
      // that merged both same-day runs instead of isolating the later one would let brand-b's two
      // votes outweigh brand-a's one, flipping the winner.
      makeWorkRow({
        id: 'r1',
        prompt_id: 'prompt-1',
        run_id: 'run-morning',
        created_at: '2026-01-02T08:00:00.000Z',
        created_at_iso_date: '2026-01-02',
        brand_ids_ranking: ['brand-b', 'brand-a'],
      }),
      makeWorkRow({
        id: 'r1b',
        prompt_id: 'prompt-2',
        run_id: 'run-morning',
        created_at: '2026-01-02T08:05:00.000Z',
        created_at_iso_date: '2026-01-02',
        brand_ids_ranking: ['brand-b', 'brand-a'],
      }),
    ];

    const result = await getRankingsSummary(brands, responses);
    expect(result.map((b) => b.brandId)).toEqual(['brand-a', 'brand-b']);
  });

  it('groups responses without a run id by their day', async () => {
    const brandA = makeBrandInfo({ brandId: 'brand-a', label: 'A' });
    const brandB = makeBrandInfo({ brandId: 'brand-b', label: 'B', isProject: false });
    const brands = new Map([
      ['brand-a', brandA],
      ['brand-b', brandB],
    ]);

    const responses = [
      // Both 01-02 rows favor brand-a; a buggy implementation that picked its group by the
      // last array element's date (here, the 01-01 row) instead of the true latest day would
      // select only the 01-01 row and flip the winner to brand-b.
      makeWorkRow({
        id: 'r1',
        prompt_id: 'prompt-1',
        run_id: null,
        created_at: '2026-01-02T08:00:00.000Z',
        created_at_iso_date: '2026-01-02',
        brand_ids_ranking: ['brand-a', 'brand-b'],
      }),
      makeWorkRow({
        id: 'r2',
        prompt_id: 'prompt-2',
        run_id: null,
        created_at: '2026-01-02T16:00:00.000Z',
        created_at_iso_date: '2026-01-02',
        brand_ids_ranking: ['brand-a', 'brand-b'],
      }),
      makeWorkRow({
        id: 'r3',
        prompt_id: 'prompt-1',
        run_id: null,
        created_at: '2026-01-01T08:00:00.000Z',
        created_at_iso_date: '2026-01-01',
        brand_ids_ranking: ['brand-b'],
      }),
    ];

    const result = await getRankingsSummary(brands, responses);
    // Both 01-02 rows are counted, and the 01-01 row does not decide the order.
    expect(result.map((b) => b.brandId)).toEqual(['brand-a', 'brand-b']);

    // Newest row first, matching DESC DB order, so correctness depends on comparing
    // `created_at` rather than on array position.
    const withFlip = [
      makeWorkRow({
        id: 'r4',
        prompt_id: 'prompt-1',
        run_id: null,
        created_at: '2026-01-03T08:00:00.000Z',
        created_at_iso_date: '2026-01-03',
        brand_ids_ranking: ['brand-b', 'brand-a'],
      }),
      makeWorkRow({
        id: 'r3',
        prompt_id: 'prompt-1',
        run_id: null,
        created_at: '2026-01-01T08:00:00.000Z',
        created_at_iso_date: '2026-01-01',
        brand_ids_ranking: ['brand-b'],
      }),
      makeWorkRow({
        id: 'r1',
        prompt_id: 'prompt-1',
        run_id: null,
        created_at: '2026-01-02T08:00:00.000Z',
        created_at_iso_date: '2026-01-02',
        brand_ids_ranking: ['brand-a', 'brand-b'],
      }),
      // Last element in the array, but not the latest day. A buggy implementation that picked
      // its group by the last array element's date (2026-01-02) instead of the true latest day
      // (2026-01-03) would include both 01-02 rows and flip the winner to brand-a.
      makeWorkRow({
        id: 'r2',
        prompt_id: 'prompt-2',
        run_id: null,
        created_at: '2026-01-02T16:00:00.000Z',
        created_at_iso_date: '2026-01-02',
        brand_ids_ranking: ['brand-a', 'brand-b'],
      }),
    ];
    const resultWithFlip = await getRankingsSummary(brands, withFlip);
    // Only the 01-03 row (r4) is used — brand-b wins there — even though it isn't last in the array.
    expect(resultWithFlip.map((b) => b.brandId)).toEqual(['brand-b', 'brand-a']);
  });

  it('handles a single brand that appears in every response', async () => {
    const brandA = makeBrandInfo({ brandId: 'brand-a', label: 'A' });
    const brands = new Map([['brand-a', brandA]]);

    const responses = [
      makeWorkRow({ id: 'r1', brand_ids_ranking: ['brand-a'] }),
      makeWorkRow({ id: 'r2', brand_ids_ranking: ['brand-a'] }),
    ];

    const result = await getRankingsSummary(brands, responses);
    expect(result).toHaveLength(1);
    expect(result[0].brandId).toBe('brand-a');
  });
});
