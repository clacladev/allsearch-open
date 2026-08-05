import { Metadata } from 'next';
import Report from './Report';

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
  return <Report projectId={projectId} runId={runId} />;
}
