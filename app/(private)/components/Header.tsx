import { ComponentType } from 'react';
import { Badge } from '@/components/base/badges/badges';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { isDefaultDateRange } from '@/libs/utils/searchParamsHelpers';

dayjs.extend(LocalizedFormat);

export default function Header({
  text,
  icon,
  description,
  rightChildren,
  startDate,
  endDate,
}: {
  text?: string;
  icon?: ComponentType<{ className?: string }>;
  description?: string;
  rightChildren?: React.ReactNode;
  startDate?: string;
  endDate?: string;
}) {
  const Icon = icon;
  return (
    <div className="navbar top-0 z-1 hidden lg:block">
      <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-primary flex items-center gap-2 text-xl font-semibold">
            {Icon && <Icon className="size-5" />}
            {text}
          </h1>
          {description && <p className="text-quaternary text-sm">{description}</p>}
        </div>

        {startDate && endDate && !isDefaultDateRange(startDate, endDate) && (
          <div className="flex-none">
            <Badge color="gray" size="sm">
              {dayjs(startDate).format('ll')} – {dayjs(endDate).format('ll')}
            </Badge>
          </div>
        )}

        {rightChildren && <div className="flex-none">{rightChildren}</div>}
      </div>
    </div>
  );
}
