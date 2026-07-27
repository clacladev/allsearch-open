import Header from '@/app/(private)/components/Header';
import { MainContainer } from '@/app/(private)/components/Containers';
import { Home02 } from '@untitledui/icons';
import { Metadata } from 'next';
import ProjectOverview from './overview/Overview';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { getOverviewPageData } from './overview/helpers';
import z from 'zod';

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { startDate, endDate } = await searchParams;
  const dateString = startDate && endDate ? `| From ${startDate} to ${endDate}` : '';
  return {
    title: `Overview ${dateString}`,
  };
}

export default async function ProjectOverviewPage({ params, searchParams }: Props) {
  const { projectId } = await params;

  const { startDate, endDate } = z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .parse(await searchParams);

  const defaultDateRange = getDefaultAnalysisDateRange();
  const startDateISO = startDate ? getISODateString(startDate) : defaultDateRange.startDateISO;
  const endDateISO = endDate ? getISODateString(endDate) : defaultDateRange.endDateISO;

  const overviewData = await getOverviewPageData(projectId, startDateISO, endDateISO);

  return (
    <MainContainer>
      <Header
        text="Overview"
        icon={Home02}
        description="Your brand's AI visibility at a glance — track how often you appear in AI-generated responses over time."
      />
      <ProjectOverview
        projectId={projectId}
        startDate={startDateISO}
        endDate={endDateISO}
        overviewData={overviewData}
      />
    </MainContainer>
  );
}
