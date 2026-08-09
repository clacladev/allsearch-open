import { ISODateString } from '@/libs/database/shared/ISODateString';
import { CollectionGroup } from './helpers';
import { insertGapBreakEntries } from './collectionSeries';
import { BrandInfo } from './types';

// E.g. { timestamp: 1736380800000, date: '2026-01-09', isGap: false, Hoka: '-0.5', Nike: '1.2' }
export type SentimentDataEntry = {
  /** Epoch ms of the Collection Run group this point describes. The chart's x value. */
  timestamp: number;
  /** ISO day of the group; null on synthetic gap-break entries. */
  date: ISODateString | null;
  /** True only on the synthetic entry inserted to break the line across a >14-day gap. */
  isGap: boolean;
  /** Brand label -> average sentiment score as a string; null on gap entries. */
  [brandLabel: string]: string | number | boolean | null;
};

export type SentimentDataset = SentimentDataEntry[];

export async function getSentimentDataset(
  brandsIdInfoMap: Map<string, BrandInfo>,
  collectionGroups: CollectionGroup[]
): Promise<SentimentDataset> {
  const entries = collectionGroups.map((group) =>
    getSentimentDatasetEntry(group, brandsIdInfoMap)
  );
  const brandLabels = brandsIdInfoMap
    .values()
    .toArray()
    .map((info) => info.label ?? 'Unknown');

  return insertGapBreakEntries(entries, brandLabels);
}

function getSentimentDatasetEntry(
  group: CollectionGroup,
  brandsIdInfoMap: Map<string, BrandInfo>
): SentimentDataEntry {
  const responses = group.responses;

  // Collect sentiment values per brand
  const brandSentimentSums = new Map<string, { sum: number; count: number }>();

  responses.forEach((response) => {
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

  return { timestamp: Date.parse(group.finishedAt), date: group.date, isGap: false, ...brandAverages };
}
