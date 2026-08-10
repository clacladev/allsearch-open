'use client';

import { usePersistedLocalStorage } from '@/hooks/usePersistedLocalStorage';
import { TopicsNames } from '@/libs/ai/topicsIdeas/getTopicsIdeas';
import { Topic, Topics } from '@/libs/ai/promptsIdeas/getPromptsIdeas';
import { ROUTES } from '@/libs/routes';
import { PromptAndTopicId } from '@/libs/utils/PromptAndTopicId';
import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// --- Persistance ---

const DRAFT_VERSION = 1;
const DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 2; // 2 days

const DRAFT_STORAGE_KEY = 'new-project:draft';

export function clearNewProjectDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
}

type NewProjectDraftPayload = {
  brand?: NewProjectBrand;
  topics?: NewProjectTopics;
  prompts?: NewProjectPrompts;
  competitors?: NewProjectCompetitors;
  projectId?: string;
};

function isEmptyDraft(draft: NewProjectDraftPayload) {
  return (
    !draft.brand &&
    !draft.topics &&
    !draft.prompts &&
    !(draft.competitors?.length ?? 0) &&
    !draft.projectId
  );
}

// --- Context ---

export enum NewProjectStep {
  Brand,
  Topics,
  Prompts,
  Competitors,
  Save,
}
export type NewProjectBrand = {
  url: string;
  name: string;
  iconUrl: string | undefined;
  targetLocation: string | undefined;
};

export type NewProjectTopics = {
  selected: TopicsNames;
  ideas: TopicsNames;
  custom: TopicsNames;
};

export type NewProjectPrompts = {
  selectedIds: PromptAndTopicId[];
  ideas: Topics;
  custom: Topic;
};

export type NewProjectCompetitors = {
  url: string;
  name: string | undefined;
  iconUrl: string | undefined;
}[];

interface NewProjectContextType {
  // Management
  getCorrectStep: () => NewProjectStep;
  resetAll: () => void;
  // Data
  brand: NewProjectBrand | undefined;
  setBrand: (brand: NewProjectBrand | undefined) => void;
  topics: NewProjectTopics | undefined;
  setTopics: (topics: NewProjectTopics | undefined) => void;
  prompts: NewProjectPrompts | undefined;
  setPrompts: (prompts: NewProjectPrompts | undefined) => void;
  competitors: NewProjectCompetitors;
  setCompetitors: (competitors: NewProjectCompetitors) => void;
}

const NewProjectContext = createContext<NewProjectContextType | undefined>(undefined);

export function NewProjectContextProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [brand, setBrand] = useState<NewProjectBrand>();
  const [topics, setTopics] = useState<NewProjectTopics>();
  const [prompts, setPrompts] = useState<NewProjectPrompts>();
  const [competitors, setCompetitors] = useState<NewProjectCompetitors>([]);

  const draftState = useMemo<NewProjectDraftPayload>(
    () => ({
      brand,
      topics,
      prompts,
      competitors,
    }),
    [brand, topics, prompts, competitors]
  );

  const setDraftState = useCallback((draft: NewProjectDraftPayload) => {
    setBrand(draft.brand);
    setTopics(draft.topics);
    setPrompts(draft.prompts);
    setCompetitors(draft.competitors ?? []);
    setIsInitialized(true);
  }, []);

  const resetDraftState = useCallback(() => setDraftState({}), []);

  usePersistedLocalStorage<NewProjectDraftPayload>({
    storageKey: DRAFT_STORAGE_KEY,
    version: DRAFT_VERSION,
    ttlMs: DRAFT_TTL_MS,
    state: draftState,
    setStateAction: setDraftState,
    resetStateAction: resetDraftState,
    isEmptyAction: isEmptyDraft,
  });

  const getCorrectCurrentStep = useCallback(() => {
    if (!brand) return NewProjectStep.Brand;
    if (!topics) return NewProjectStep.Topics;
    if (!prompts) return NewProjectStep.Prompts;
    if (!competitors.length) return NewProjectStep.Competitors;
    return NewProjectStep.Save;
  }, [brand, topics, prompts, competitors.length]);

  return (
    <NewProjectContext.Provider
      value={{
        getCorrectStep: getCorrectCurrentStep,
        resetAll: resetDraftState,
        brand,
        setBrand,
        topics,
        setTopics,
        prompts,
        setPrompts,
        competitors,
        setCompetitors,
      }}
    >
      {isInitialized ? children : null}
    </NewProjectContext.Provider>
  );
}

export function useNewProjectContext() {
  const context = useContext(NewProjectContext);
  if (context) return context;
  throw new Error('useNewProjectContext must be used within a NewProjectContextProvider');
}

// --- Utilities ---

/** Where a restored draft resumes. `getCorrectStep()` answers "first step whose data is missing",
 * which is what the mid-flow forward guards want; on entry it needs one clamp: Save is not a form
 * but an auto-submitting side effect, and a draft that merely *reached* the competitors screen
 * already has competitors in it (CompetitorsForm stores them when the fetch resolves, not on
 * Finish). Resuming into Save would create a project and start a Collection Run the user never
 * confirmed. */
export function resumeStepForDraft(correctStep: NewProjectStep): NewProjectStep {
  return correctStep > NewProjectStep.Competitors ? NewProjectStep.Competitors : correctStep;
}

export function routeForStep(step: NewProjectStep) {
  switch (step) {
    case NewProjectStep.Brand:
      return ROUTES.NEW_PROJECT.BRAND;
    case NewProjectStep.Topics:
      return ROUTES.NEW_PROJECT.TOPICS;
    case NewProjectStep.Prompts:
      return ROUTES.NEW_PROJECT.PROMPTS;
    case NewProjectStep.Competitors:
      return ROUTES.NEW_PROJECT.COMPETITORS;
    case NewProjectStep.Save:
      return ROUTES.NEW_PROJECT.SAVE;
  }
}
