import { mkConfig, generateCsv, download } from 'export-to-csv';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { SourceDomain } from '@/libs/utils/project-analysis/getSourceDomainsSummary';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { RouteHelper } from '@/libs/routes';
import { sanitizeCsvRow } from '@/libs/utils/csvSanitize';

export function resolveBrandName(
  brandId: string,
  project: ProjectRow,
  competitors: CompetitorRow[]
): string {
  if (brandId === project.id) return project.name;
  const competitor = competitors.find((c) => c.id === brandId);
  return competitor?.name ?? brandId;
}

export function exportSourceDomainsToCsv(
  domains: SourceDomain[],
  startDate: string,
  endDate: string
): void {
  const filename = `sources_domains_${startDate}_${endDate}`;
  const csvConfig = mkConfig({ useKeysAsHeaders: true, filename });

  const rows = domains.map((domain) => ({
    Hostname: domain.hostname,
    Category: domain.domainCategory,
    'Used %': domain.usedPercentage,
    'Cited %': domain.citedPercentage,
    URL: `https://${domain.hostname}`,
  }));

  const csv = generateCsv(csvConfig)(rows.map(sanitizeCsvRow));
  download(csvConfig)(csv);
}

export function exportSourceContentsToCsv(
  contents: SourceContent[],
  project: ProjectRow,
  competitors: CompetitorRow[],
  startDate: string,
  endDate: string
): void {
  const filename = `sources_contents_${startDate}_${endDate}`;
  const csvConfig = mkConfig({ useKeysAsHeaders: true, filename });
  const origin = window.location.origin;

  const rows = contents.map((content) => {
    const brandNames = content.brandIdsRanking
      .map((id) => resolveBrandName(id, project, competitors))
      .join(', ');

    const mention = content.projectIdRank >= 0 ? `#${content.projectIdRank + 1}` : '';
    const detailsUrl =
      origin +
      RouteHelper.Project.getSourceDetails(project.id, content.id, startDate, endDate, content.title);

    return {
      URL: content.url,
      Title: content.title ?? '',
      Category: content.domainCategory,
      'Used %': content.usedPercentage,
      'Cited %': content.citedPercentage,
      Mention: mention,
      Brands: brandNames,
      'Details URL': detailsUrl,
    };
  });

  const csv = generateCsv(csvConfig)(rows.map(sanitizeCsvRow));
  download(csvConfig)(csv);
}
