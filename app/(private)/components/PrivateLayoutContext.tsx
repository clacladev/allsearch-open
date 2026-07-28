'use client';

import { CompetitorRow } from '@/libs/database/Competitors/types';
import { OrganizationRow } from '@/libs/database/Organizations/types';
import { ProjectRow } from '@/libs/database/Projects/types';
import { PromptRow } from '@/libs/database/Prompts/types';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

interface PrivateLayoutContextType {
  organization: OrganizationRow | undefined;
  setOrganization: (organization: OrganizationRow | undefined) => void;

  projects: ProjectRow[];
  setProjects: (projects: ProjectRow[]) => void;
  removeProject: (projectId: string) => void;

  currentProject: ProjectRow | undefined;
  setCurrentProject: (currentProject: ProjectRow | undefined) => void;

  allCurrentCompetitors: CompetitorRow[];
  currentCompetitors: CompetitorRow[];
  archiveCompetitor: (competitorId: string) => void;
  addCompetitor: (competitor: CompetitorRow) => void;
  updateCompetitor: (competitorId: string, competitor: CompetitorRow) => void;

  allCurrentPrompts: PromptRow[];
  currentPrompts: PromptRow[];
  archivePrompt: (promptId: string) => void;
  addPrompt: (prompt: PromptRow) => void;
  updatePrompt: (promptId: string, prompt: PromptRow) => void;
}

const PrivateLayoutContext = createContext<PrivateLayoutContextType | undefined>(undefined);

export function PrivateLayoutContextProvider({
  initialValues,
  children,
}: {
  initialValues: {
    organization: OrganizationRow;
    projects: ProjectRow[];
    competitors: CompetitorRow[];
    prompts: PromptRow[];
  };
  children: ReactNode;
}) {
  const [organization, setOrganization] = useState<OrganizationRow>();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectRow | undefined>();
  const [competitorsMap, setCompetitorsMap] = useState<Record<string, CompetitorRow[]>>({});
  const [currentCompetitors, setCurrentCompetitors] = useState<CompetitorRow[]>([]);
  const [allCurrentCompetitors, setAllCurrentCompetitors] = useState<CompetitorRow[]>([]);
  const [promptsMap, setPromptsMap] = useState<Record<string, PromptRow[]>>({});
  const [allCurrentPrompts, setAllCurrentPrompts] = useState<PromptRow[]>([]);
  const [currentPrompts, setCurrentPrompts] = useState<PromptRow[]>([]);

  useEffect(() => {
    setOrganization(initialValues.organization);
    setProjects(initialValues.projects);
    setCompetitorsMap(
      initialValues.competitors.reduce(
        (acc, competitor) => {
          const projectCompetitors = acc[competitor.project_id] || [];
          projectCompetitors.push(competitor);
          acc[competitor.project_id] = projectCompetitors;
          return acc;
        },
        {} as Record<string, CompetitorRow[]>
      )
    );
    setPromptsMap(
      initialValues.prompts.reduce(
        (acc, prompt) => {
          const projectPrompts = acc[prompt.project_id] || [];
          projectPrompts.push(prompt);
          acc[prompt.project_id] = projectPrompts;
          return acc;
        },
        {} as Record<string, PromptRow[]>
      )
    );
  }, [initialValues]);

  const removeProject = useCallback(
    (projectId: string) => {
      const newProjects = projects.filter((project) => project.id !== projectId);
      setProjects(newProjects);
      if (currentProject?.id === projectId) {
        setCurrentProject(newProjects[0]);
      }
    },
    [projects, currentProject]
  );

  const archiveCompetitor = useCallback(
    (competitorId: string) =>
      setCompetitorsMap((prev) => {
        const projectId = currentProject?.id;
        if (!projectId) return prev;
        const competitorIndex = prev[projectId].findIndex((c) => c.id === competitorId);
        if (competitorIndex === -1) return prev;

        const newArray = [...prev[projectId]];
        newArray[competitorIndex] = { ...newArray[competitorIndex], is_archived: true };
        return { ...prev, [projectId]: newArray };
      }),
    [currentProject]
  );

  const addCompetitor = useCallback(
    (competitor: CompetitorRow) =>
      setCompetitorsMap((prev) => {
        const projectId = currentProject?.id;
        if (!projectId) return prev;
        const existing = prev[projectId] || [];
        const existingIndex = existing.findIndex((c) => c.id === competitor.id);
        if (existingIndex !== -1) {
          const filtered = existing.filter((_, i) => i !== existingIndex);
          return { ...prev, [projectId]: [...filtered, { ...competitor, is_archived: false }] };
        }
        return { ...prev, [projectId]: [...existing, competitor] };
      }),
    [currentProject]
  );

  const updateCompetitor = useCallback(
    (competitorId: string, competitor: CompetitorRow) =>
      setCompetitorsMap((prev) => {
        const projectId = currentProject?.id;
        if (!projectId) return prev;
        const existing = prev[projectId] || [];
        return {
          ...prev,
          [projectId]: existing.map((c) => (c.id === competitorId ? competitor : c)),
        };
      }),
    [currentProject]
  );

  const archivePrompt = useCallback(
    (promptId: string) =>
      setPromptsMap((prev) => {
        const projectIdKey = currentProject?.id;
        if (!projectIdKey) return prev;
        const existing = prev[projectIdKey] || [];
        const promptIndex = existing.findIndex((p) => p.id === promptId);
        if (promptIndex === -1) return prev;

        const newArray = [...existing];
        newArray[promptIndex] = { ...newArray[promptIndex], is_archived: true };
        return {
          ...prev,
          [projectIdKey]: newArray,
        };
      }),
    [currentProject]
  );

  const addPrompt = useCallback(
    (prompt: PromptRow) =>
      setPromptsMap((prev) => {
        const projectId = currentProject?.id;
        if (!projectId) return prev;
        const existing = prev[projectId] || [];
        const existingIndex = existing.findIndex((p) => p.id === prompt.id);
        if (existingIndex !== -1) {
          const filtered = existing.filter((_, i) => i !== existingIndex);
          return { ...prev, [projectId]: [...filtered, { ...prompt, is_archived: false }] };
        }
        return { ...prev, [projectId]: [...existing, prompt] };
      }),
    [currentProject]
  );

  const updatePrompt = useCallback(
    (promptId: string, prompt: PromptRow) =>
      setPromptsMap((prev) => {
        const projectId = currentProject?.id;
        if (!projectId) return prev;
        const existing = prev[projectId] || [];
        return {
          ...prev,
          [projectId]: existing.map((p) => (p.id === promptId ? prompt : p)),
        };
      }),
    [currentProject]
  );

  useEffect(() => {
    if (!currentProject) return;
    const allCompetitors = currentProject ? competitorsMap[currentProject.id] || [] : [];
    setAllCurrentCompetitors(allCompetitors);
    setCurrentCompetitors(allCompetitors.filter((c) => !c.is_archived));
  }, [currentProject, competitorsMap]);

  useEffect(() => {
    if (!currentProject) return;
    const allPrompts = currentProject ? promptsMap[currentProject.id] || [] : [];
    setAllCurrentPrompts(allPrompts);
    setCurrentPrompts(allPrompts.filter((p) => !p.is_archived));
  }, [currentProject, promptsMap]);

  return (
    <PrivateLayoutContext.Provider
      value={{
        organization,
        setOrganization,

        projects,
        setProjects,
        removeProject,

        currentProject,
        setCurrentProject,

        allCurrentCompetitors,
        currentCompetitors,
        archiveCompetitor,
        addCompetitor,
        updateCompetitor,

        allCurrentPrompts,
        currentPrompts,
        addPrompt,
        updatePrompt,
        archivePrompt,
      }}
    >
      {children}
    </PrivateLayoutContext.Provider>
  );
}

export function usePrivateLayoutContext() {
  const context = useContext(PrivateLayoutContext);
  if (context) return context;
  throw new Error('useLayoutContext must be used within a PrivateLayoutContextProvider');
}
