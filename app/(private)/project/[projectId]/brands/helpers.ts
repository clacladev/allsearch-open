import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { areDomainsRelated } from '@/libs/utils/domainUtils';
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
  const allBrands = [
    { id: project.id, hostname: project.hostname },
    ...competitors.map((c) => ({ id: c.id, hostname: c.hostname })),
  ];

  // Count sources per brand and collect all sources belonging to any brand
  const brandSourceCounts: Record<string, number> = Object.fromEntries(
    allBrands.map((b) => [b.id, 0])
  );

  const allBrandSources = sourceContent.filter((source) => {
    const sourceHostname = source.cleanUrl.split('/')[0];
    let matchesAny = false;
    for (const { id, hostname } of allBrands) {
      if (areDomainsRelated(sourceHostname, hostname)) {
        brandSourceCounts[id]++;
        matchesAny = true;
      }
    }
    return matchesAny;
  });

  // No filter applied — return all brand sources
  if (selectedBrandIds.length === 0) {
    return { sources: allBrandSources, brandSourceCounts };
  }

  // Filter to only sources matching the selected brands
  const selectedHostnames = allBrands
    .filter(({ id }) => selectedBrandIds.includes(id))
    .map(({ hostname }) => hostname);

  const filtered = allBrandSources.filter((source) => {
    const sourceHostname = source.cleanUrl.split('/')[0];
    return selectedHostnames.some((hostname) => areDomainsRelated(sourceHostname, hostname));
  });

  return { sources: filtered, brandSourceCounts };
}
