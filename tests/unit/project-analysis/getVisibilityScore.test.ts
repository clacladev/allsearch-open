import { describe, expect, it } from 'bun:test';
import { getVisibilityScore } from '@/libs/utils/project-analysis/getVisibilityScore';
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

describe('getVisibilityScore', () => {
  it('returns an empty array when there are no prompt responses', () => {
    const brands = new Map([['brand-1', makeBrandInfo()]]);
    const result = getVisibilityScore(brands, []);
    expect(result).toEqual([]);
  });

  it('returns 0% for a brand that never appears in any response', () => {
    const brands = new Map([['brand-1', makeBrandInfo({ brandId: 'brand-1' })]]);
    const responses = [makeWorkRow({ brand_ids_ranking: ['other-brand'] })];
    const result = getVisibilityScore(brands, responses);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ brandId: 'brand-1', percentage: 0 });
  });

  it('returns 100% when the brand appears in every response', () => {
    const brands = new Map([['brand-1', makeBrandInfo({ brandId: 'brand-1' })]]);
    const responses = [
      makeWorkRow({ brand_ids_ranking: ['brand-1'] }),
      makeWorkRow({ id: 'r2', brand_ids_ranking: ['brand-1'] }),
    ];
    const result = getVisibilityScore(brands, responses);
    expect(result[0]).toEqual({ brandId: 'brand-1', percentage: 100 });
  });

  it('calculates correct percentage when the brand appears in some responses', () => {
    const brands = new Map([['brand-1', makeBrandInfo({ brandId: 'brand-1' })]]);
    const responses = [
      makeWorkRow({ id: 'r1', brand_ids_ranking: ['brand-1'] }),
      makeWorkRow({ id: 'r2', brand_ids_ranking: ['brand-1'] }),
      makeWorkRow({ id: 'r3', brand_ids_ranking: [] }),
      makeWorkRow({ id: 'r4', brand_ids_ranking: [] }),
    ];
    const result = getVisibilityScore(brands, responses);
    expect(result[0]).toEqual({ brandId: 'brand-1', percentage: 50 });
  });

  it('rounds the percentage to the nearest integer', () => {
    const brands = new Map([['brand-1', makeBrandInfo({ brandId: 'brand-1' })]]);
    // 1 out of 3 = 33.33% → rounds to 33
    const responses = [
      makeWorkRow({ id: 'r1', brand_ids_ranking: ['brand-1'] }),
      makeWorkRow({ id: 'r2', brand_ids_ranking: [] }),
      makeWorkRow({ id: 'r3', brand_ids_ranking: [] }),
    ];
    const result = getVisibilityScore(brands, responses);
    expect(result[0]).toEqual({ brandId: 'brand-1', percentage: 33 });
  });

  it('ignores brands in responses that are not in the brands map', () => {
    const brands = new Map([['brand-1', makeBrandInfo({ brandId: 'brand-1' })]]);
    const responses = [
      makeWorkRow({ brand_ids_ranking: ['brand-1', 'unknown-brand'] }),
    ];
    const result = getVisibilityScore(brands, responses);
    expect(result).toHaveLength(1);
    expect(result[0].brandId).toBe('brand-1');
  });

  it('tracks multiple brands independently', () => {
    const brands = new Map([
      ['brand-a', makeBrandInfo({ brandId: 'brand-a', label: 'A' })],
      ['brand-b', makeBrandInfo({ brandId: 'brand-b', label: 'B', isProject: false })],
    ]);
    const responses = [
      makeWorkRow({ id: 'r1', brand_ids_ranking: ['brand-a', 'brand-b'] }),
      makeWorkRow({ id: 'r2', brand_ids_ranking: ['brand-a'] }),
      makeWorkRow({ id: 'r3', brand_ids_ranking: [] }),
      makeWorkRow({ id: 'r4', brand_ids_ranking: [] }),
    ];
    const result = getVisibilityScore(brands, responses);
    const brandA = result.find((r) => r.brandId === 'brand-a');
    const brandB = result.find((r) => r.brandId === 'brand-b');
    expect(brandA?.percentage).toBe(50); // 2 out of 4
    expect(brandB?.percentage).toBe(25); // 1 out of 4
  });

  it('initialises all brands to 0 even if map is empty', () => {
    const brands = new Map([
      ['brand-a', makeBrandInfo({ brandId: 'brand-a' })],
      ['brand-b', makeBrandInfo({ brandId: 'brand-b', isProject: false })],
    ]);
    const responses = [makeWorkRow({ brand_ids_ranking: [] })];
    const result = getVisibilityScore(brands, responses);
    expect(result).toHaveLength(2);
    result.forEach((r) => expect(r.percentage).toBe(0));
  });
});
