import { Metadata } from 'next';
import Report from './Report';

export const metadata: Metadata = { title: 'New Project - Report' };

export default async function ReportPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <Report projectId={projectId} />;
}
