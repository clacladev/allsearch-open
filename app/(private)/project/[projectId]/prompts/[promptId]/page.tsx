import Header from '@/app/(private)/components/Header';
import { MainContainer } from '@/app/(private)/components/Containers';
import { MessageCircle01 } from '@untitledui/icons';
import { Metadata } from 'next';
import z from 'zod';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { getPromptResponsesData } from './helpers';
import PromptDetails from './components/PromptDetails';
import { getPaginatedResult } from '@/libs/utils/PaginatedResult';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';
import { getUserOrRedirectToSignin } from '@/libs/database/supabase/server';
import { getPromptArticleRowsForPromptId } from '@/libs/database/PromptArticles/queries';

const PAGE_SIZE = 8;

type Props = {
  params: Promise<{ projectId: string; promptId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { promptId } = await params;
  const { startDate, endDate, title } = await searchParams;

  const titleString = title ? `| ${title}` : `#${promptId}`;
  const dateString = startDate && endDate ? `| From ${startDate} to ${endDate}` : '';

  return {
    title: `Prompt Details ${titleString} ${dateString}`,
  };
}

export default async function ProjectPromptsPage({ params, searchParams }: Props) {
  const { projectId, promptId } = await params;

  const { startDate, endDate, pageNo } = z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      pageNo: z.coerce.number().min(0).optional().default(0),
    })
    .parse(await searchParams);

  const defaultDateRange = getDefaultAnalysisDateRange();
  const startDateISO = startDate ? getISODateString(startDate) : defaultDateRange.startDateISO;
  const endDateISO = endDate ? getISODateString(endDate) : defaultDateRange.endDateISO;

  const user = await getUserOrRedirectToSignin();

  const [{ sourceContentsSummary, promptResponsesContents }, previouslyGeneratedArticles] =
    await Promise.all([
      getPromptResponsesData(projectId, promptId, startDateISO, endDateISO),
      getPromptArticleRowsForPromptId({
        authorId: user.id,
        projectId,
        promptId,
      }),
    ]);

  const sourceData = getPaginatedResult(sourceContentsSummary, pageNo, PAGE_SIZE);

  return (
    <MainContainer>
      <Header
        text="Prompt Details"
        icon={MessageCircle01}
        description="See how AI models responded to this specific prompt and which sources they cited."
        startDate={startDate}
        endDate={endDate}
      />
      <PromptDetails
        projectId={projectId}
        promptId={promptId}
        sourceData={sourceData}
        promptResponsesContents={promptResponsesContents}
        previouslyGeneratedArticles={previouslyGeneratedArticles}
        startDate={startDate}
        endDate={endDate}
      />
    </MainContainer>
  );
}
