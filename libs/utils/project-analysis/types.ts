import { SourceItem } from '@/libs/database/Sources/types';

export type BrandInfo = {
  brandId: string;
  label: string;
  iconUrl?: string;
  isProject: boolean;
};

export const OPPORTUNITY_TYPES = [
  'ProjectSourceNotCitedOpportunity',
  'ProjectSourceNeedsImprovementOpportunity',
  'ProjectSourceNotFoundOpportunity',
  'ProjectSourceNotConsistentlyFoundOpportunity',
  'UgcSourceNeedsImprovementOpportunity',
] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

/**
 * Subset of opportunity types that surface a "Create / Improve article outline"
 * CTA on the opportunity detail page and that the outline generation flow
 * supports. Keep in sync with `isImproveContentOpportunity` and
 * `isCreateContentOpportunity` in OpportunityDetails.
 */
export const OUTLINE_OPPORTUNITY_TYPES = [
  'ProjectSourceNotFoundOpportunity',
  'ProjectSourceNotCitedOpportunity',
  'ProjectSourceNeedsImprovementOpportunity',
] as const;

export type OutlineOpportunityType = (typeof OUTLINE_OPPORTUNITY_TYPES)[number];

export type Opportunity =
  | ProjectSourceNotCitedOpportunity
  | ProjectSourceNeedsImprovementOpportunity
  | ProjectSourceNotFoundOpportunity
  | ProjectSourceNotConsistentlyFoundOpportunity
  | UgcSourceNeedsImprovementOpportunity;

export const DIFFICULTY_ORDER: Record<OpportunityType, number> = {
  UgcSourceNeedsImprovementOpportunity: 1,
  ProjectSourceNotCitedOpportunity: 2,
  ProjectSourceNotFoundOpportunity: 2,
  ProjectSourceNotConsistentlyFoundOpportunity: 2,
  ProjectSourceNeedsImprovementOpportunity: 3,
};

type PromptId = string;

export type SourceItemCounter = SourceItem & {
  citationCount: number;
};

export type ProjectSourceNotCitedOpportunity = {
  id: string;
  type: 'ProjectSourceNotCitedOpportunity';
  projectSource?: Omit<SourceItem, 'isCited' | 'brandIdsRanking'>;
  promptsBasedInspiration: Record<
    PromptId,
    { sources: SourceItem[]; promptResponseIds: string[] }
  >;
  priorityScore: number;
};

export type ProjectSourceNeedsImprovementOpportunity = {
  id: string;
  type: 'ProjectSourceNeedsImprovementOpportunity';
  projectSource?: Omit<SourceItem, 'isCited' | 'brandIdsRanking'>;
  promptsBasedInspiration: Record<
    PromptId,
    { sources: SourceItem[]; promptResponseIds: string[] }
  >;
  priorityScore: number;
};

export type ProjectSourceNotFoundOpportunity = {
  id: string;
  type: 'ProjectSourceNotFoundOpportunity';
  promptId: PromptId;
  inspirationSources: SourceItemCounter[];
  promptResponseIds: string[];
  priorityScore: number;
};

export type ProjectSourceNotConsistentlyFoundOpportunity = {
  id: string;
  type: 'ProjectSourceNotConsistentlyFoundOpportunity';
  promptId: PromptId;
  inspirationSources: SourceItemCounter[];
  promptResponseIds: string[];
  priorityScore: number;
};

export type UgcSourceNeedsImprovementOpportunity = {
  id: string;
  type: 'UgcSourceNeedsImprovementOpportunity';
  promptId: PromptId;
  source: SourceItemCounter;
  promptResponseIds: string[];
  priorityScore: number;
};
