import { ArrowRight } from '@untitledui/icons';
import { Badge } from '@/components/base/badges/badges';
import SourcesTypeButtonGroup from '../../../sources/components/SourcesTypeButtonGroup';
import { SourcesType } from '@/app/(private)/project/[projectId]/sources/components/types';
import { Button } from '@/components/base/buttons/button';
import { StandardTableFooterContainer } from '@/app/(private)/components/StandardTable/StandardTable';

export const TopSourceTableHeaderTrailingContent = ({
  sourceType,
  onSourceTypeChange,
  badgeText,
}: {
  sourceType: SourcesType;
  onSourceTypeChange: (sourceType: SourcesType) => void;
  badgeText?: string;
}) => (
  <div className="flex items-center gap-4">
    {!!badgeText && (
      <Badge color="brand" size="sm">
        {badgeText}
      </Badge>
    )}

    <SourcesTypeButtonGroup
      size="xs"
      sourceType={sourceType}
      onSourceTypeChangeAction={onSourceTypeChange}
    />
  </div>
);

export const OverviewTableFooter = ({ href }: { href: string }) => (
  <StandardTableFooterContainer>
    <Button href={href} color="tertiary" size="xs" iconTrailing={ArrowRight}>
      View more
    </Button>
  </StandardTableFooterContainer>
);
