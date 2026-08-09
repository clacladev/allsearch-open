import { ISODateString } from '@/libs/database/shared/ISODateString';
import { CollectionGroup } from './helpers';
import { insertGapBreakEntries } from './collectionSeries';
import { BrandInfo } from './types';

// E.g. { timestamp: 1736380800000, date: '2026-01-09', isGap: false, Hoka: '33', Nike: '22' }
export type VisibilityDataEntry = {
  /** Epoch ms of the Collection Run group this point describes. The chart's x value. */
  timestamp: number;
  /** ISO day of the group; null on synthetic gap-break entries. */
  date: ISODateString | null;
  /** True only on the synthetic entry inserted to break the line across a >14-day gap. */
  isGap: boolean;
  /** Brand label -> visibility percentage as a string; null on gap entries. */
  [brandLabel: string]: string | number | boolean | null;
};

export type VisibilityDataset = VisibilityDataEntry[];

export async function getVisibilityDataset(
  brandsIdInfoMap: Map<string, BrandInfo>,
  collectionGroups: CollectionGroup[]
): Promise<VisibilityDataset> {
  const entries = collectionGroups.map((group) =>
    getVisibilityDatasetEntry(group, brandsIdInfoMap)
  );
  const brandLabels = brandsIdInfoMap
    .values()
    .toArray()
    .map((info) => info.label ?? 'Unknown');

  return insertGapBreakEntries(entries, brandLabels);
}

function getVisibilityDatasetEntry(
  group: CollectionGroup,
  brandsIdInfoMap: Map<string, BrandInfo>
): VisibilityDataEntry {
  const responses = group.responses;
  const responsesCount = responses.length;

  // Count brand mentions in the responses
  const brandsVisibilityCount: Map<string, number> = new Map();
  brandsIdInfoMap.forEach((_, brandId) => brandsVisibilityCount.set(brandId, 0));
  responses.forEach((response) => {
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
      avg: Math.round((count / responsesCount) * 100).toString(),
    }));

  return {
    timestamp: Date.parse(group.finishedAt),
    date: group.date,
    isGap: false,
    ...brandsVisibilityAvg.reduce((acc, { brandId, avg }) => {
      const info = brandsIdInfoMap.get(brandId);
      const label = info?.label ?? 'Unknown';
      return { ...acc, [label]: avg };
    }, {}),
  };
}
