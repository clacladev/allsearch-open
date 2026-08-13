import Header from '@/app/(private)/components/Header';
import { MainContainer } from '@/app/(private)/components/Containers';
import { ShieldCheck } from 'lucide-react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { CrawlHealthClient } from './CrawlHealthClient';

type Props = {
  params: Promise<{ projectId: string }>;
};

export const metadata: Metadata = {
  title: 'Crawl health',
};

export default async function ProjectCrawlHealthPage({ params }: Props) {
  const { projectId } = await params;
  const project = await getProjectRowWithId(projectId);
  if (!project) notFound();

  return (
    <MainContainer>
      <Header
        text="Crawl health"
        icon={ShieldCheck}
        description={`Whether AI crawlers can reach ${project.name} at ${project.url}.`}
      />
      <CrawlHealthClient
        projectId={project.id}
        projectName={project.name}
        url={project.url}
      />
    </MainContainer>
  );
}
