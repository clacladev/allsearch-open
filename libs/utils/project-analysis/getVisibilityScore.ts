import { PromptResponseWorkRow } from './helpers';
import { BrandInfo } from './types';

export type VisibilityScoreItem = {
  brandId: string;
  percentage: number; // 0-100
};

export type VisibilityScores = VisibilityScoreItem[];

export function getVisibilityScore(
  brandsIdInfoMap: Map<string, BrandInfo>,
  promptResponses: PromptResponseWorkRow[]
): VisibilityScores {
  const totalCount = promptResponses.length;
  if (!totalCount) return [];

  const brandAppearanceCount = new Map<string, number>();
  brandsIdInfoMap.forEach((_, brandId) => brandAppearanceCount.set(brandId, 0));

  promptResponses.forEach((response) => {
    response.brand_ids_ranking.forEach((brandId) => {
      if (!brandsIdInfoMap.has(brandId)) return;
      brandAppearanceCount.set(brandId, (brandAppearanceCount.get(brandId) || 0) + 1);
    });
  });

  return Array.from(brandAppearanceCount.entries()).map(([brandId, count]) => ({
    brandId,
    percentage: Math.round((count / totalCount) * 100),
  }));
}
