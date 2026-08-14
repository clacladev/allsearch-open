import Header from '@/app/(private)/components/Header';
import { MainContainer } from '@/app/(private)/components/Containers';
import { Globe } from 'lucide-react';
import { Metadata } from 'next';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { getSourcesContentData } from '../helpers';
import SourceDetails from './components/SourceDetails';
import z from 'zod';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';

type Props = {
  params: Promise<{ projectId: string; sourceId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { sourceId } = await params;
  const { startDate, endDate, title } = await searchParams;

  const titleString = title ? `| ${title}` : `#${sourceId}`;
  const dateString = startDate && endDate ? `| From ${startDate} to ${endDate}` : '';

  return {
    title: `Source Details ${titleString} ${dateString}`,
  };
}

export default async function ProjectSourceDetailsPage({ params, searchParams }: Props) {
  const { projectId, sourceId } = await params;

  const { startDate, endDate } = z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .parse(await searchParams);

  const defaultDateRange = getDefaultAnalysisDateRange();
  const startDateISO = startDate ? getISODateString(startDate) : defaultDateRange.startDateISO;
  const endDateISO = endDate ? getISODateString(endDate) : defaultDateRange.endDateISO;

  const summary = await getSourcesContentData(projectId, startDateISO, endDateISO, true);
  const source = summary.data.find((s) => s.id === sourceId);

  return (
    <MainContainer>
      <Header
        text="Source Details"
        icon={Globe}
        description="Performance breakdown for this source — how often it's cited and which prompts reference it."
        startDate={startDate}
        endDate={endDate}
      />
      <SourceDetails source={source} startDate={startDate} endDate={endDate} />
    </MainContainer>
  );
}
