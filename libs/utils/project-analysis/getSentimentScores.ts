import { PromptResponseWorkRow } from './helpers';
import { BrandInfo } from './types';

export type SentimentScoreItem = {
  brandId: string;
  averageSentiment: number; // -2 to +2
};

export type SentimentScores = SentimentScoreItem[];

export function getSentimentScores(
  brandsIdInfoMap: Map<string, BrandInfo>,
  promptResponses: PromptResponseWorkRow[]
): SentimentScores {
  if (!promptResponses.length) return [];

  const brandSentimentSums = new Map<string, { sum: number; count: number }>();

  promptResponses.forEach((response) => {
    if (!response.sentiment) return;
    brandsIdInfoMap.forEach((_, brandId) => {
      const score = response.sentiment?.[brandId];
      if (score === undefined) return;
      const current = brandSentimentSums.get(brandId) ?? { sum: 0, count: 0 };
      brandSentimentSums.set(brandId, { sum: current.sum + score, count: current.count + 1 });
    });
  });

  return Array.from(brandSentimentSums.entries()).map(([brandId, { sum, count }]) => ({
    brandId,
    averageSentiment: sum / count,
  }));
}
