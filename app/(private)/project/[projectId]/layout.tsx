import { ReactNode } from 'react';
import CurrentProjectSetter from './components/CurrentProjectSetter';

export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ projectId: string }>;
  children: ReactNode;
}) {
  const { projectId } = await params;
  return <CurrentProjectSetter projectId={projectId}>{children}</CurrentProjectSetter>;
}
