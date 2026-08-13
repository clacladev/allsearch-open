import { Badge } from '@/components/ui/badge';
import { cn } from '@/libs/utils/cn';
import { Feather, MessageCircleMore, Wrench } from 'lucide-react';
import { OpportunityType } from '@/libs/utils/project-analysis/types';
import { OPPORTUNITY_TYPE_NAME } from '@/libs/utils/opportunities';
import { Tooltip } from '@/app/(private)/components/Tooltip';

const OPPORTUNITY_TYPE_BADGE_CLASS: Record<OpportunityType, string> = {
  ProjectSourceNotCitedOpportunity:
    'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900 dark:text-orange-100 dark:ring-orange-800',
  ProjectSourceNeedsImprovementOpportunity:
    'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900 dark:text-orange-100 dark:ring-orange-800',
  ProjectSourceNotConsistentlyFoundOpportunity:
    'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900 dark:text-orange-100 dark:ring-orange-800',
  ProjectSourceNotFoundOpportunity:
    'bg-utility-brand-50 text-utility-brand-700 ring-utility-brand-200',
  UgcSourceNeedsImprovementOpportunity:
    'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:ring-purple-800',
};

const MODERN_BADGE_CLASS =
  'h-auto rounded-md border-0 bg-primary px-1.5 text-secondary shadow-xs ring-1 ring-inset ring-primary';

const COLORED_BADGE_CLASS =
  'h-auto gap-2 rounded-md border-0 px-1.5 py-0.5 shadow-xs ring-1 ring-inset [&>svg]:size-4!';

export const ActionBadge = ({ opportunityType }: { opportunityType: OpportunityType }) => (
  <>
    {opportunityType === 'ProjectSourceNotCitedOpportunity' ||
    opportunityType === 'ProjectSourceNeedsImprovementOpportunity' ||
    opportunityType === 'ProjectSourceNotConsistentlyFoundOpportunity' ? (
      <Badge
        variant="outline"
        className={cn(COLORED_BADGE_CLASS, OPPORTUNITY_TYPE_BADGE_CLASS[opportunityType])}
      >
        <Wrench className="size-4" />
        {OPPORTUNITY_TYPE_NAME[opportunityType]}
      </Badge>
    ) : opportunityType === 'ProjectSourceNotFoundOpportunity' ? (
      <Badge
        variant="outline"
        className={cn(COLORED_BADGE_CLASS, OPPORTUNITY_TYPE_BADGE_CLASS[opportunityType])}
      >
        <Feather className="size-4" />
        {OPPORTUNITY_TYPE_NAME[opportunityType]}
      </Badge>
    ) : opportunityType === 'UgcSourceNeedsImprovementOpportunity' ? (
      <Badge
        variant="outline"
        className={cn(COLORED_BADGE_CLASS, OPPORTUNITY_TYPE_BADGE_CLASS[opportunityType])}
      >
        <MessageCircleMore className="size-4" />
        {OPPORTUNITY_TYPE_NAME[opportunityType]}
      </Badge>
    ) : null}
  </>
);

// ---------------------------------------------

const PRIORITY_LEVELS = {
  high: { text: 'High', dotClass: 'bg-red-500' },
  medium: { text: 'Medium', dotClass: 'bg-amber-500' },
  low: { text: 'Low', dotClass: 'bg-emerald-500' },
};

export const getPriorityLabel = (score: number) => {
  if (score > 100) return PRIORITY_LEVELS.high;
  if (score === 100) return PRIORITY_LEVELS.medium;
  return PRIORITY_LEVELS.low;
};

export const PRIORITY_SCORE_TOOLTIP =
  'Higher priority means higher impact on your average rankings';

type PriorityScoreBadgeProps = {
  priorityScore: number;
  variation?: 'short' | 'long';
};

export const PriorityScoreBadge = ({
  priorityScore,
  variation = 'short',
}: PriorityScoreBadgeProps) => {
  const { text, dotClass } = getPriorityLabel(priorityScore);
  return (
    <Badge variant="outline" className={MODERN_BADGE_CLASS}>
      <span className={cn('size-1.5 rounded-full', dotClass)} aria-hidden="true" />
      {variation === 'long' ? `Priority: ${text}` : text}
    </Badge>
  );
};

export const PriorityScoreBadgeWithTooltip = ({
  priorityScore,
  variation,
}: PriorityScoreBadgeProps) => {
  return (
    <Tooltip title={PRIORITY_SCORE_TOOLTIP}>
      <PriorityScoreBadge priorityScore={priorityScore} variation={variation} />
    </Tooltip>
  );
};

// ---------------------------------------------

export const DIFFICULTY_MAP: Record<OpportunityType, string> = {
  ProjectSourceNotCitedOpportunity: 'Medium',
  ProjectSourceNeedsImprovementOpportunity: 'Hard',
  ProjectSourceNotFoundOpportunity: 'Medium',
  ProjectSourceNotConsistentlyFoundOpportunity: 'Medium',
  UgcSourceNeedsImprovementOpportunity: 'Easy',
};

export const DIFFICULTY_TOOLTIP = 'Estimated effort to act on this opportunity';

type DifficultyBadgeProps = {
  opportunityType: OpportunityType;
  variation?: 'short' | 'long';
};

export const DifficultyBadge = ({ opportunityType, variation = 'short' }: DifficultyBadgeProps) => (
  <Badge variant="outline" className={MODERN_BADGE_CLASS}>
    {variation === 'long'
      ? `Difficulty: ${DIFFICULTY_MAP[opportunityType]}`
      : DIFFICULTY_MAP[opportunityType]}
  </Badge>
);

export const DifficultyBadgeWithTooltip = ({
  opportunityType,
  variation,
}: DifficultyBadgeProps) => (
  <Tooltip title={DIFFICULTY_TOOLTIP}>
    <DifficultyBadge opportunityType={opportunityType} variation={variation} />
  </Tooltip>
);
