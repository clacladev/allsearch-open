import { mkConfig, generateCsv, download } from 'export-to-csv';
import { Opportunity } from '@/libs/utils/project-analysis/types';
import { PromptRow } from '@/libs/database/Prompts/types';
import {
  OPPORTUNITY_TYPE_NAME,
  OPPORTUNITY_TYPE_SHORT_DESCRIPTION,
} from '@/libs/utils/opportunities';
import { RouteHelper } from '@/libs/routes';
import { DIFFICULTY_MAP, getPriorityLabel } from '../components/Badges';

export function getOpportunityDescription(opportunity: Opportunity, prompts: PromptRow[]): string {
  const shortDesc = OPPORTUNITY_TYPE_SHORT_DESCRIPTION[opportunity.type];
  if (
    opportunity.type === 'ProjectSourceNotCitedOpportunity' ||
    opportunity.type === 'ProjectSourceNeedsImprovementOpportunity'
  ) {
    return `${shortDesc} — Content: ${opportunity.projectSource?.cleanUrl ?? ''}`;
  }
  if (
    opportunity.type === 'ProjectSourceNotFoundOpportunity' ||
    opportunity.type === 'ProjectSourceNotConsistentlyFoundOpportunity'
  ) {
    const promptName = prompts.find((p) => p.id === opportunity.promptId)?.name ?? '';
    return `${shortDesc} — Prompt: ${promptName}`;
  }
  if (opportunity.type === 'UgcSourceNeedsImprovementOpportunity') {
    return `${shortDesc} — Source: ${opportunity.source.cleanUrl}`;
  }
  return shortDesc;
}

export function exportOpportunitiesToCsv(
  opportunities: Opportunity[],
  prompts: PromptRow[],
  projectId: string,
  startDate: string,
  endDate: string
): void {
  const filename = `opportunities_${startDate}_${endDate}`;
  const csvConfig = mkConfig({ useKeysAsHeaders: true, filename });
  const origin = window.location.origin;

  const rows = opportunities.map((opportunity) => ({
    Type: OPPORTUNITY_TYPE_NAME[opportunity.type],
    Description: getOpportunityDescription(opportunity, prompts),
    Priority: getPriorityLabel(opportunity.priorityScore).text,
    Difficulty: DIFFICULTY_MAP[opportunity.type],
    'Details URL':
      origin +
      RouteHelper.Project.getOpportunityDetails(projectId, opportunity.id, startDate, endDate),
  }));

  const csv = generateCsv(csvConfig)(rows);
  download(csvConfig)(csv);
}
