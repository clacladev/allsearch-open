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
    const brands = new Map([['brand-a', brandA]]);

    const responses = [
      // Newest row first — the DB returns rows DESC by created_at.
      makeWorkRow({
        id: 'r2',
        created_at: '2026-01-03T10:00:00.000Z',
        created_at_iso_date: '2026-01-03',
        brand_ids_ranking: ['brand-a'],
      }),
      makeWorkRow({
        id: 'r1',
        created_at: '2026-01-01T10:00:00.000Z',
        created_at_iso_date: '2026-01-01',
        brand_ids_ranking: [],
      }),
    ];

    const result = await getRankingsSummary(brands, responses);
    // Only the latest date (2026-01-03) is used — brand-a appears in that response
    expect(result[0].brandId).toBe('brand-a');
  });

  it('describes the latest run even when it is nine days old and nothing came after it', async () => {
    const brandA = makeBrandInfo({ brandId: 'brand-a', label: 'A' });
    const brandB = makeBrandInfo({ brandId: 'brand-b', label: 'B', isProject: false });
    const brands = new Map([
      ['brand-a', brandA],
      ['brand-b', brandB],
    ]);

    const responses = [
      makeWorkRow({
        id: 'r1',
        run_id: 'run-older',
        created_at: '2025-12-23T10:00:00.000Z',
        created_at_iso_date: '2025-12-23',
        brand_ids_ranking: ['brand-b', 'brand-a'],
      }),
      makeWorkRow({
        id: 'r2',
        run_id: 'run-stale',
        created_at: '2026-01-01T10:00:00.000Z',
        created_at_iso_date: '2026-01-01',
        brand_ids_ranking: ['brand-a', 'brand-b'],
      }),
    ];

    const result = await getRankingsSummary(brands, responses);
    expect(result[0].brandId).toBe('brand-a');
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
      makeWorkRow({
        id: 'r1',
        run_id: 'run-morning',
        created_at: '2026-01-02T08:00:00.000Z',
        created_at_iso_date: '2026-01-02',
        brand_ids_ranking: ['brand-b', 'brand-a'],
      }),
    ];

    const result = await getRankingsSummary(brands, responses);
    expect(result[0].brandId).toBe('brand-a');
  });

  it('groups responses without a run id by their day', async () => {
    const brandA = makeBrandInfo({ brandId: 'brand-a', label: 'A' });
    const brandB = makeBrandInfo({ brandId: 'brand-b', label: 'B', isProject: false });
    const brands = new Map([
      ['brand-a', brandA],
      ['brand-b', brandB],
    ]);

    const responses = [
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
    ];

    const result = await getRankingsSummary(brands, responses);
    // Both 01-02 rows are counted (a tie), and the 01-01 row does not decide the order.
    expect(result).toHaveLength(2);

    const withFlip = [
      ...responses,
      makeWorkRow({
        id: 'r4',
        prompt_id: 'prompt-1',
        run_id: null,
        created_at: '2026-01-03T08:00:00.000Z',
        created_at_iso_date: '2026-01-03',
        brand_ids_ranking: ['brand-b', 'brand-a'],
      }),
    ];
    const resultWithFlip = await getRankingsSummary(brands, withFlip);
    // A further day-keyed group (01-03) both includes its own row and excludes the earlier ones.
    expect(resultWithFlip[0].brandId).toBe('brand-b');
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
