import { Metadata } from 'next';
import Report from './Report';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getOverviewPageData } from '@/app/(private)/project/[projectId]/overview/helpers';
import { getISODateString, getTodayISODateString } from '@/libs/database/shared/ISODateString';
import { OverviewData } from '@/libs/utils/project-analysis/getOverviewData';

export const metadata: Metadata = { title: 'New Project - Report' };

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ runId?: string }>;
}) {
  const { projectId } = await params;
  const { runId } = await searchParams;

  // The report anchors on the day the latest Collection Run finished
  // (`project.prompts_updated_at`), today's empty snapshot when no Run has claimed
  // prompts yet, so the page renders blank rather than 503-ing on a fresh save.
  const project = await getProjectRowWithId(projectId);
  const targetDateISO = project?.prompts_updated_at
    ? getISODateString(project.prompts_updated_at)
    : getTodayISODateString();

  let initialData: OverviewData | undefined;
  try {
    initialData = await getOverviewPageData(projectId, targetDateISO, targetDateISO);
  } catch (error) {
    console.error(error);
  }

  return <Report projectId={projectId} runId={runId} initialData={initialData} />;
}