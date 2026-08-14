import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SourcesTypeButtonGroup from '../../../sources/components/SourcesTypeButtonGroup';
import { SourcesType } from '@/app/(private)/project/[projectId]/sources/components/types';
import { Button } from '@/components/ui/button';
import { StandardTableFooterContainer } from '@/app/(private)/components/StandardTable/StandardTable';
import Link from 'next/link';

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
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
      >
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
    <Button render={<Link href={href} />} variant="ghost" size="xs">
      View more
      <ArrowRight />
    </Button>
  </StandardTableFooterContainer>
);
