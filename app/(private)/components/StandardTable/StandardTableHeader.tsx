import { AppTooltip } from '@/components/shared/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/libs/utils/cn';
import { CircleHelp } from 'lucide-react';
import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';

export function StandardTableHeader({
  title,
  titleHref,
  icon: Icon,
  tooltip,
  description,
  badgeTrailing,
  contentTrailing,
  className,
}: {
  title: string;
  titleHref?: string;
  icon?: ComponentType<{ className?: string }>;
  tooltip?: string;
  description?: string;
  badgeTrailing?: ReactNode;
  contentTrailing?: ReactNode;
  className?: string;
}) {
  const titleContent = (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="text-muted-foreground size-4" />}
      <h2 className="text-foreground text-sm font-semibold">{title}</h2>
    </div>
  );

  return (
    <div
      className={cn('border-border relative flex items-center gap-4 border-b px-4 py-3', className)}
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {titleHref ? <Link href={titleHref}>{titleContent}</Link> : titleContent}
          {tooltip && (
            <AppTooltip content={tooltip}>
              <CircleHelp className="text-muted-foreground size-4" aria-label={tooltip} />
            </AppTooltip>
          )}
        </div>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>

      {badgeTrailing &&
        (typeof badgeTrailing === 'string' || typeof badgeTrailing === 'number' ? (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          >
            {badgeTrailing}
          </Badge>
        ) : (
          badgeTrailing
        ))}
      {contentTrailing}
    </div>
  );
}
