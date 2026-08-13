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
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
  );

  return (
    <div
      className={cn(
        'relative flex items-center gap-4 border-b border-border px-4 py-5 md:px-6',
        className
      )}
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
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {badgeTrailing &&
        (typeof badgeTrailing === 'string' || typeof badgeTrailing === 'number' ? (
          <Badge>{badgeTrailing}</Badge>
        ) : (
          badgeTrailing
        ))}
      {contentTrailing}
    </div>
  );
}
