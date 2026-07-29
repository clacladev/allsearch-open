import { mkConfig, generateCsv, download } from 'export-to-csv';
import { PromptAndTopicJoinRow } from '@/libs/database/Prompts/types';
import { PromptAnalysis } from '@/app/api/project/[projectId]/prompts/getPromptsAnalysis';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { RouteHelper } from '@/libs/routes';
import { resolveBrandName } from '@/app/(private)/project/[projectId]/sources/utils/exportSourcesCsv';
import { getSentimentLabel } from '@/app/(private)/project/[projectId]/components/SentimentIcon';

export function exportPromptsToCsv(
  prompts: PromptAndTopicJoinRow[],
  analysisData: Record<string, PromptAnalysis>,
  project: ProjectRow,
  competitors: CompetitorRow[],
  projectId: string,
  startDate: string,
  endDate: string
): void {
  const filename = `prompts_${startDate}_${endDate}`;
  const csvConfig = mkConfig({ useKeysAsHeaders: true, filename });
  const origin = window.location.origin;

  const rows = prompts.map((prompt) => {
    const analysis = analysisData[prompt.id];
    const brandNames = (analysis?.brandIdsRanking ?? [])
      .map((id) => resolveBrandName(id, project, competitors))
      .join(', ');

    const mention = analysis && analysis.projectIdRank >= 0 ? `#${analysis.projectIdRank + 1}` : '';
    const detailsUrl =
      origin + RouteHelper.Project.getPromptDetails(projectId, prompt.id, startDate, endDate);

    const sentiment =
      analysis?.projectSentimentAvg !== undefined
        ? getSentimentLabel(analysis.projectSentimentAvg)
        : '';

    return {
      Prompt: prompt.name,
      Group: prompt.topic_name,
      '# Responses': analysis?.count ?? 0,
      Mention: mention,
      Sentiment: sentiment,
      Brands: brandNames,
      Added: prompt.created_at.slice(0, 10),
      'Details URL': detailsUrl,
    };
  });

  const csv = generateCsv(csvConfig)(rows);
  download(csvConfig)(csv);
}
