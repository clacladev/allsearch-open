import { mkConfig, generateCsv, download } from 'export-to-csv';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { RouteHelper } from '@/libs/routes';

export function exportBrandSourcesToCsv(
  sources: SourceContent[],
  projectId: string,
  startDate: string,
  endDate: string
): void {
  const filename = `brand_sources_${startDate}_${endDate}`;
  const csvConfig = mkConfig({ useKeysAsHeaders: true, filename });
  const origin = window.location.origin;

  const rows = sources.map((source) => {
    const detailsUrl =
      origin +
      RouteHelper.Project.getSourceDetails(projectId, source.id, startDate, endDate, source.title);

    return {
      URL: source.url,
      Title: source.title ?? '',
      Category: source.domainCategory,
      'Used %': source.usedPercentage,
      'Cited %': source.citedPercentage,
      'Details URL': detailsUrl,
    };
  });

  const csv = generateCsv(csvConfig)(rows);
  download(csvConfig)(csv);
}
