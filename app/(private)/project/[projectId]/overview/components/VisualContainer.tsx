import { TooltipIcon } from '@/app/(private)/components/Tooltip';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/libs/utils/cn';
import { ComponentType } from 'react';

export const VisualContainer = ({
  className,
  title,
  info,
  caption,
  icon,
  isSquare = true,
  contentClassName,
  headerTrailing,
  children,
}: React.PropsWithChildren<{
  className?: string;
  title: string;
  info?: string;
  /** Small line under the title — used for the issue-09 Chatbot-coverage caption on figures that
   * aggregate across Chatbots (e.g. `ChatbotCoverageCaption`). */
  caption?: React.ReactNode;
  icon?: ComponentType<{ className?: string }>;
  isSquare?: boolean;
  contentClassName?: string;
  headerTrailing?: React.ReactNode;
  children: React.ReactNode;
}>) => {
  const Icon = icon;
  return (
    <Card size="sm" className={cn('gap-5 px-4 py-3', className)}>
      <CardHeader className="gap-1 px-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="text-muted-foreground size-4" />}
            <CardTitle>{title}</CardTitle>
            {info && <TooltipIcon title={title} description={info} />}
          </div>
          {caption}
        </div>
        {headerTrailing && <CardAction>{headerTrailing}</CardAction>}
      </CardHeader>
      <CardContent className={cn('px-0', isSquare ? 'min-h-50' : '', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
};
