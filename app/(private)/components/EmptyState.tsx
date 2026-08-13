'use client';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/libs/utils/cn';
import { ArrowLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type EmptyStateVariant = 'default' | 'compact';

const ICON_COLOR_CLASS: Record<'gray' | 'warning' | 'error', string> = {
  gray: 'bg-muted text-foreground',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-500',
  error: 'bg-destructive/10 text-destructive',
};

export const EmptyState = ({
  title,
  description,
  variant = 'default',
  shouldShowGoBackButton,
  customActionTitle,
  customAction,
  className,
  iconColor = 'gray',
}: {
  title: string;
  description?: string | React.ReactNode;
  variant?: EmptyStateVariant;
  shouldShowGoBackButton?: boolean;
  customActionTitle?: string;
  customAction?: () => void;
  className?: string;
  /** Lets callers (e.g. AI credential-failure states) signal severity through the icon's color
   * instead of always rendering the neutral default. */
  iconColor?: 'gray' | 'warning' | 'error';
}) => {
  const router = useRouter();
  return (
    <Empty
      className={cn(
        'h-full',
        variant === 'default' && 'pt-50 pb-25',
        variant === 'compact' && 'pt-20 pb-2',
        className
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className={cn(ICON_COLOR_CLASS[iconColor])}>
          <Search />
        </EmptyMedia>

        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>

      {(shouldShowGoBackButton || customAction) && (
        <EmptyContent className="flex-row">
          {shouldShowGoBackButton && (
            <Button size="sm" variant="secondary" onClick={() => router.back()}>
              <ArrowLeft />
              Go back
            </Button>
          )}
          {customAction && (
            <Button size="sm" variant="secondary" onClick={customAction}>
              {customActionTitle ?? 'Action'}
            </Button>
          )}
        </EmptyContent>
      )}
    </Empty>
  );
};
