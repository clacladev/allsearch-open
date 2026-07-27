import { getISODateString, ISODateString } from '@/libs/database/shared/ISODateString';
import { PromptResponseWorkRow } from './helpers';
import { BrandInfo } from './types';

// E.g. { date: '2026-01-09', Hoka: '-0.5', Nike: '1.2' }
type SentimentDataEntry = {
  date: string; // Date in format YYYY-MM-DD
  [key: string]: string; // Brand name: average sentiment score
};

export type SentimentDataset = SentimentDataEntry[];

export async function getSentimentDataset(
  startDate: ISODateString,
  endDate: ISODateString,
  brandsIdInfoMap: Map<string, BrandInfo>,
  promptResponses: PromptResponseWorkRow[]
): Promise<SentimentDataset> {
  const dataset: SentimentDataset = [];

  const date = new Date(startDate);
  while (date <= new Date(endDate)) {
    const entry = getSentimentDatasetEntry(
      getISODateString(date),
      brandsIdInfoMap,
      promptResponses
    );
    if (entry) dataset.push(entry);
    date.setDate(date.getDate() + 1);
  }

  return dataset;
}

function getSentimentDatasetEntry(
  targetDate: ISODateString,
  brandsIdInfoMap: Map<string, BrandInfo>,
  promptResponses: PromptResponseWorkRow[]
): SentimentDataEntry | undefined {
  const filteredResponses = promptResponses.filter(
    (response) => response.created_at_iso_date === targetDate
  );
  if (!filteredResponses.length) return;

  // Collect sentiment values per brand
  const brandSentimentSums = new Map<string, { sum: number; count: number }>();

  filteredResponses.forEach((response) => {
    if (!response.sentiment) return;
    brandsIdInfoMap.forEach((_, brandId) => {
      const score = response.sentiment?.[brandId];
      if (score === undefined) return;
      const current = brandSentimentSums.get(brandId) ?? { sum: 0, count: 0 };
      brandSentimentSums.set(brandId, { sum: current.sum + score, count: current.count + 1 });
    });
  });

  // Build entry with all brands — default to neutral (0) if no sentiment data
  const brandAverages: Record<string, string> = {};
  brandsIdInfoMap.forEach((info, brandId) => {
    const label = info.label ?? 'Unknown';
    const stats = brandSentimentSums.get(brandId);
    brandAverages[label] = stats ? (stats.sum / stats.count).toFixed(1) : '0.0';
  });

  return { date: targetDate, ...brandAverages };
}
