import { Badge, BadgeWithDot } from '@/components/base/badges/badges';
import { Feather, MessageTextCircle02, Tool01 } from '@untitledui/icons';
import { OpportunityType } from '@/libs/utils/project-analysis/types';
import { OPPORTUNITY_TYPE_NAME } from '@/libs/utils/opportunities';
import { Tooltip } from '@/app/(private)/components/Tooltip';

export const ActionBadge = ({ opportunityType }: { opportunityType: OpportunityType }) => (
  <>
    {opportunityType === 'ProjectSourceNotCitedOpportunity' ||
    opportunityType === 'ProjectSourceNeedsImprovementOpportunity' ||
    opportunityType === 'ProjectSourceNotConsistentlyFoundOpportunity' ? (
      <Badge size="sm" color="orange" type="color" className="flex gap-2">
        <Tool01 className="size-4" />
        {OPPORTUNITY_TYPE_NAME[opportunityType]}
      </Badge>
    ) : opportunityType === 'ProjectSourceNotFoundOpportunity' ? (
      <Badge size="sm" color="brand" type="color" className="flex gap-2">
        <Feather className="size-4" />
        {OPPORTUNITY_TYPE_NAME[opportunityType]}
      </Badge>
    ) : opportunityType === 'UgcSourceNeedsImprovementOpportunity' ? (
      <Badge size="sm" color="purple" type="color" className="flex gap-2">
        <MessageTextCircle02 className="size-4" />
        {OPPORTUNITY_TYPE_NAME[opportunityType]}
      </Badge>
    ) : null}
  </>
);

// ---------------------------------------------

const PRIORITY_LEVELS = {
  high: { text: 'High', color: 'error' as const },
  medium: { text: 'Medium', color: 'warning' as const },
  low: { text: 'Low', color: 'success' as const },
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
  const { text, color } = getPriorityLabel(priorityScore);
  return (
    <BadgeWithDot size="sm" type="modern" color={color}>
      {variation === 'long' ? `Priority: ${text}` : text}
    </BadgeWithDot>
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
  <Badge size="sm" type="modern">
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
