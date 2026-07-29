'use client';

import { EmptyState as EmptyStateBase } from '@/components/application/empty-state/empty-state';
import { Button } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';
import { ArrowLeft } from '@untitledui/icons';
import { useRouter } from 'next/navigation';

export type EmptyStateVariant = 'default' | 'compact';

export const EmptyState = ({
  title,
  description,
  variant = 'default',
  shouldShowGoBackButton,
  customActionTitle,
  customAction,
  className,
}: {
  title: string;
  description?: string | React.ReactNode;
  variant?: EmptyStateVariant;
  shouldShowGoBackButton?: boolean;
  customActionTitle?: string;
  customAction?: () => void;
  className?: string;
}) => {
  const router = useRouter();
  return (
    <EmptyStateBase
      size="md"
      className={cx(
        'h-full **:z-0',
        variant === 'default' && 'pt-50 pb-25',
        variant === 'compact' && 'pt-20 pb-2',
        className
      )}
    >
      <EmptyStateBase.Header>
        <EmptyStateBase.FeaturedIcon color="gray" />
      </EmptyStateBase.Header>

      <EmptyStateBase.Content>
        <EmptyStateBase.Title>{title}</EmptyStateBase.Title>
        <EmptyStateBase.Description>{description}</EmptyStateBase.Description>
      </EmptyStateBase.Content>

      <EmptyStateBase.Footer>
        {shouldShowGoBackButton && (
          <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={() => router.back()}>
            Go back
          </Button>
        )}
        {customAction && (
          <Button size="sm" color="secondary" onClick={customAction}>
            {customActionTitle ?? 'Action'}
          </Button>
        )}
      </EmptyStateBase.Footer>
    </EmptyStateBase>
  );
};
