import { Tooltip } from '@/app/(private)/components/Tooltip';
import { cn } from '@/libs/utils/cn';
import { ReactNode } from 'react';

export const SourceStatisticBox = ({
  title,
  value,
  tooltipTitle,
  tooltipDescription,
  className,
}: {
  title?: string | ReactNode;
  value?: string | ReactNode;
  tooltipTitle?: string;
  tooltipDescription?: string;
  className?: string;
}) => {
  const body = (
    <div
      className={cn('bg-primary ring-secondary rounded-xl shadow-xs ring-1 ring-inset', className)}
    >
      <div className="relative flex flex-col gap-2 px-4 py-5 md:px-5">
        <h3 className="text-tertiary flex items-center gap-1 text-sm font-medium">{title}</h3>

        <div className="flex items-end gap-4">
          <div className="text-primary flex flex-1 items-center gap-2 font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );

  return tooltipTitle ? (
    <Tooltip title={tooltipTitle} description={tooltipDescription}>
      {body}
    </Tooltip>
  ) : (
    body
  );
};
