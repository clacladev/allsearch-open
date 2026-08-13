import { Tooltip } from '@/app/(private)/components/Tooltip';
import { CheckCircle2 } from 'lucide-react';
import { toOrdinal } from '@/libs/numberFormatters';

export const BrandPositionBadge = ({
  projectIdRank,
  hideWhenNotMentioned = false,
}: {
  projectIdRank: number;
  hideWhenNotMentioned?: boolean;
}) => {
  const isMentioned = projectIdRank !== -1;
  const ordinal = toOrdinal(projectIdRank + 1);

  if (!isMentioned) {
    return hideWhenNotMentioned ? null : <span className="text-tertiary">No mention</span>;
  }

  return (
    <Tooltip title={`Your brand position is ${ordinal}`}>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="text-brand-secondary" size={14} />
        <span className="text-tertiary">{ordinal}</span>
      </div>
    </Tooltip>
  );
};
