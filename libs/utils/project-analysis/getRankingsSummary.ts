import { PromptResponseWorkRow } from './helpers';
import { BrandInfo } from './types';

export async function getRankingsSummary(
  brandsIdInfoMap: Map<string, BrandInfo>,
  promptResponses: PromptResponseWorkRow[]
): Promise<BrandInfo[]> {
  if (!promptResponses.length) return [];

  // Find the latest date (assuming responses are sorted by created_at)
  const endDate = promptResponses[promptResponses.length - 1].created_at_iso_date;
  const filteredResponses = promptResponses.filter(
    (response) => response.created_at_iso_date === endDate
  );

  const brandsRankingsSums: Map<string, number> = new Map();
  const brandsRankingsCounts: Map<string, number> = new Map();

  // Initialise the maps with all the brands (including the project)
  brandsIdInfoMap.forEach((brandInfo) => {
    brandsRankingsSums.set(brandInfo.brandId, 0);
    brandsRankingsCounts.set(brandInfo.brandId, 0);
  });

  // Calculate rankings sums and counts
  filteredResponses.forEach((response) => {
    response.brand_ids_ranking.forEach((brandId, rank) => {
      brandsRankingsSums.set(brandId, (brandsRankingsSums.get(brandId) || 0) + rank);
      brandsRankingsCounts.set(brandId, (brandsRankingsCounts.get(brandId) || 0) + 1);
    });
  });

  // Add penalties for missing in a response
  const missingPenalty = filteredResponses.length + 1;
  brandsRankingsCounts.entries().forEach(([brandId, count]) => {
    if (count < filteredResponses.length) {
      const missingCount = filteredResponses.length - count;
      brandsRankingsSums.set(
        brandId,
        (brandsRankingsSums.get(brandId) || 0) + missingCount * missingPenalty
      );
    }
  });

  // Sort brands by sum (lower is better)
  return brandsRankingsSums
    .entries()
    .toArray()
    .sort((a, b) => a[1] - b[1])
    .map(([brandId]) => brandsIdInfoMap.get(brandId))
    .filter((brand) => brand !== undefined);
}
