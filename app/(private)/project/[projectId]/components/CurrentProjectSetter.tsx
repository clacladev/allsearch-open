'use client';

import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { ReactNode, useEffect } from 'react';

export default function CurrentProjectSetter({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const { projects, setCurrentProject } = usePrivateLayoutContext();

  useEffect(() => {
    setCurrentProject(projects?.find((project) => project.id === projectId));
  }, [projects, setCurrentProject, projectId]);

  return children;
}
