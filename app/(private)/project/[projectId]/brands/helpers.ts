import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { BrandOption } from './components/BrandSelector';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';

export function getAvailableBrandsData(
  project: ProjectRow | undefined,
  competitors: CompetitorRow[]
): BrandOption[] {
  if (!project) return [];

  return [
    { id: project.id, label: project.name, iconUrl: project.icon_url ?? undefined },
    ...competitors.map((c) => ({
      id: c.id,
      label: c.name ?? c.hostname,
      iconUrl: c.icon_url ?? undefined,
    })),
  ];
}

export interface BrandsSourcesResult {
  sources: SourceContent[];
  brandSourceCounts: Record<string, number>;
}

export function getBrandsSourcesData(
  project: ProjectRow,
  competitors: CompetitorRow[],
  sourceContent: SourceContent[],
  selectedBrandIds: string[]
): BrandsSourcesResult {
  const allBrandIds = [project.id, ...competitors.map((competitor) => competitor.id)];

  // Count sources per brand and collect sources mentioning any brand.
  const brandSourceCounts: Record<string, number> = Object.fromEntries(
    allBrandIds.map((brandId) => [brandId, 0])
  );

  const allBrandSources = sourceContent.filter((source) => {
    let matchesAny = false;
    for (const brandId of allBrandIds) {
      if (source.brandIdsRanking?.includes(brandId)) {
        brandSourceCounts[brandId]++;
        matchesAny = true;
      }
    }
    return matchesAny;
  });

  // No filter applied — return all brand sources
  if (selectedBrandIds.length === 0) {
    return { sources: allBrandSources, brandSourceCounts };
  }

  // Filter to only sources mentioning the selected brands.
  const filtered = allBrandSources.filter((source) =>
    source.brandIdsRanking?.some((brandId) => selectedBrandIds.includes(brandId))
  );

  return { sources: filtered, brandSourceCounts };
}
