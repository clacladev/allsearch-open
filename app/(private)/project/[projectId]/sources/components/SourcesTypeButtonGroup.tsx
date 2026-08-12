'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SourcesType } from '@/app/(private)/project/[projectId]/sources/components/types';
import { Circle } from 'lucide-react';
import { cn } from '@/libs/utils/cn';

const TABLE_VARIANT: { sourceType: SourcesType; label: string }[] = [
  { sourceType: 'contents', label: 'Contents' },
  { sourceType: 'domains', label: 'Domains' },
];

export default function SourcesTypeButtonGroup({
  size = 'sm',
  sourceType,
  onSourceTypeChangeAction,
}: {
  size?: 'xs' | 'sm';
  sourceType: SourcesType;
  onSourceTypeChangeAction: (sourceType: SourcesType) => void;
}) {
  return (
    <ToggleGroup
      value={[sourceType]}
      onValueChange={(value) => {
        const nextSourceType = value[0] as SourcesType | undefined;
        if (nextSourceType) onSourceTypeChangeAction(nextSourceType);
      }}
      variant="outline"
      size={size === 'xs' ? 'sm' : 'default'}
      spacing={0}
      aria-label="Source type"
    >
      {TABLE_VARIANT.map((item) => (
        <ToggleGroupItem
          key={item.sourceType}
          value={item.sourceType}
        >
          <Circle
            aria-hidden="true"
            className={cn(
                'mr-1 size-2 fill-current',
                sourceType === item.sourceType ? 'text-fg-success-secondary' : 'text-fg-tertiary'
            )}
          />
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
