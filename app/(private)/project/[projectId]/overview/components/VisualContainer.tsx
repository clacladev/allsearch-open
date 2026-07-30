import { TooltipIcon } from '@/app/(private)/components/Tooltip';
import { cx } from '@/utils/cx';
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
    <div
      className={cx(
        'lg:g-primary ring-secondary flex flex-col gap-6 rounded-xl px-4 py-3 shadow-xs ring-1 lg:gap-5',
        className
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="text-tertiary size-4" />}
              <span className="text-primary text-sm font-semibold">{title}</span>
              {info && <TooltipIcon title={title} description={info} />}
            </div>
            {headerTrailing}
          </div>
          {caption}
        </div>
        <div className={cx(isSquare ? 'min-h-50' : '', contentClassName)}>{children}</div>
      </div>
    </div>
  );
};
