import Header from '@/app/(private)/components/Header';
import { MainContainer } from '@/app/(private)/components/Containers';
import { ActivityHeart } from '@untitledui/icons';
import { Metadata } from 'next';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import z from 'zod';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getPromptResponseRowsWithProjectIdInDateRange } from '@/libs/database/PromptResponses/queries';
import { getSourceRowsWithProjectIdInDateRange } from '@/libs/database/Sources/queries';
import { getPromptResponsesWorkRows } from '@/libs/utils/project-analysis/helpers';
import { getOpportunitiesSummary } from '@/libs/utils/project-analysis/getOpportunitiesSummary';
import { getUserOrRedirectToSignin } from '@/libs/database/supabase/server';
import { getPromptArticleRowsForOpportunityId } from '@/libs/database/PromptArticles/queries';
import { getUniqueId } from '@/libs/signature';
import OpportunityDetails from './components/OpportunityDetails';
import { buildSourceIdMap, getRecentResponsesForOpportunity } from './components/helpers';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';

type Props = {
  params: Promise<{ projectId: string; opportunityId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { opportunityId } = await params;
  const { startDate, endDate, title } = await searchParams;

  const titleString = title ? `| ${title}` : `#${opportunityId}`;
  const dateString = startDate && endDate ? `| From ${startDate} to ${endDate}` : '';

  return {
    title: `Opportunity Details ${titleString} ${dateString}`,
  };
}

export default async function ProjectSourceDetailsPage({ params, searchParams }: Props) {
  const { projectId, opportunityId } = await params;

  const { startDate, endDate } = z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .parse(await searchParams);

  const defaultDateRange = getDefaultAnalysisDateRange();
  const startDateISO = startDate ? getISODateString(startDate) : defaultDateRange.startDateISO;
  const endDateISO = endDate ? getISODateString(endDate) : defaultDateRange.endDateISO;

  const user = await getUserOrRedirectToSignin();

  const [project, promptResponses, sourceRows, previouslyGeneratedArticles] = await Promise.all([
    getProjectRowWithId(projectId),
    getPromptResponseRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
    getSourceRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
    getPromptArticleRowsForOpportunityId({
      authorId: user.id,
      projectId,
      opportunityId,
    }),
  ]);
  if (!project) throw new Error('Failed to get project');
  if (!promptResponses.length) throw new Error('Failed to get prompt responses');

  const promptResponsesWorkRows = getPromptResponsesWorkRows(promptResponses, sourceRows);
  const summary = await getOpportunitiesSummary(project, promptResponsesWorkRows);
  const opportunity = summary.data.find((o) => o.id === opportunityId);
  const sourceIdMap = opportunity ? buildSourceIdMap(opportunity, getUniqueId) : undefined;
  const recentResponses = opportunity
    ? getRecentResponsesForOpportunity(opportunity, projectId, promptResponses, sourceRows)
    : {};

  return (
    <MainContainer>
      <Header
        text="Opportunity Details"
        icon={ActivityHeart}
        description="A closer look at this opportunity — see which prompts and sources are involved and what action to take."
        startDate={startDate}
        endDate={endDate}
      />
      <OpportunityDetails
        opportunity={opportunity}
        sourceIdMap={sourceIdMap}
        recentResponses={recentResponses}
        previouslyGeneratedArticles={previouslyGeneratedArticles}
        startDate={startDate}
        endDate={endDate}
      />
    </MainContainer>
  );
}
