'use client';

import { ButtonGroup, ButtonGroupItem } from '@/components/base/button-group/button-group';
import { SourcesType } from '@/app/(private)/project/[projectId]/sources/components/types';
import { Dot } from '@/components/foundations/dot-icon';
import { cx } from '@/utils/cx';

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
    <ButtonGroup selectedKeys={[sourceType]} size={size}>
      {TABLE_VARIANT.map((item) => (
        <ButtonGroupItem
          key={item.sourceType}
          id={item.sourceType}
          iconLeading={
            <Dot
              className={cx(
                'mx-0.75 size-2',
                sourceType === item.sourceType ? 'text-fg-success-secondary' : 'text-fg-tertiary'
              )}
            />
          }
          onClick={() => onSourceTypeChangeAction(item.sourceType)}
        >
          {item.label}
        </ButtonGroupItem>
      ))}
    </ButtonGroup>
  );
}
