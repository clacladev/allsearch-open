import { getISODateString, ISODateString } from '@/libs/database/shared/ISODateString';
import { PromptResponseWorkRow } from './helpers';
import { BrandInfo } from './types';

// E.g. { date: '2026-01-09', Hoka: '33', Nike: '22' }
type VisibilityDataEntry = {
  date: string; // Date in format YYYY-MM-DD
  [key: string]: string; // Brand name: visibility percentage (e.g. Hoka: '33')
};

export type VisibilityDataset = VisibilityDataEntry[];

export async function getVisibilityDataset(
  startDate: ISODateString,
  endDate: ISODateString,
  brandsIdInfoMap: Map<string, BrandInfo>,
  promptResponses: PromptResponseWorkRow[]
): Promise<VisibilityDataset> {
  const visibilityDataset: VisibilityDataset = [];

  const date = new Date(startDate);
  while (date <= new Date(endDate)) {
    const entry = getVisibilityDatasetEntry(
      getISODateString(date),
      brandsIdInfoMap,
      promptResponses
    );
    if (entry) visibilityDataset.push(entry);
    date.setDate(date.getDate() + 1);
  }

  return visibilityDataset;
}

function getVisibilityDatasetEntry(
  targetDate: ISODateString,
  brandsIdInfoMap: Map<string, BrandInfo>,
  promptResponses: PromptResponseWorkRow[]
): VisibilityDataEntry | undefined {
  // Keep only responses for the current date
  const filteredResponses = promptResponses.filter(
    (response) => response.created_at_iso_date === targetDate
  );
  const filteredResponsesCount = filteredResponses.length;
  if (!filteredResponsesCount) return;

  // Count brand mentions in the responses
  const brandsVisibilityCount: Map<string, number> = new Map();
  brandsIdInfoMap.forEach((_, brandId) => brandsVisibilityCount.set(brandId, 0));
  filteredResponses.forEach((response) => {
    response.brand_ids_ranking.forEach((brandId) => {
      if (!brandsIdInfoMap.has(brandId)) return;
      brandsVisibilityCount.set(brandId, (brandsVisibilityCount.get(brandId) || 0) + 1);
    });
  });

  const brandsVisibilityAvg = brandsVisibilityCount
    .entries()
    .toArray()
    .map(([brandId, count]) => ({
      brandId,
      avg: Math.round((count / filteredResponsesCount) * 100).toString(),
    }));

  return {
    date: targetDate,
    ...brandsVisibilityAvg.reduce((acc, { brandId, avg }) => {
      const info = brandsIdInfoMap.get(brandId);
      const label = info?.label ?? 'Unknown';
      return { ...acc, [label]: avg };
    }, {}),
  };
}
