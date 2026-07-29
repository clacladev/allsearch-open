'use client';

import { Favicon } from '@/app/(private)/components/Favicon';
import { OverviewData } from '@/libs/utils/project-analysis/getOverviewData';
import { PROJECT_BRAND_COLOR } from '@/libs/utils/brandColor';
import { cx } from '@/utils/cx';

export function getVisibilityScoresBarChartData(
  data: OverviewData | undefined
): VisibilityScoresBarChartItem[] {
  if (!data || !data.visibilityScores.length) return [];
  return data.visibilityScores
    .map((item): VisibilityScoresBarChartItem => {
      const brand = data.brands.find((b) => b.brandId === item.brandId);
      return {
        id: item.brandId,
        name: brand?.label ?? item.brandId,
        iconUrl: brand?.iconUrl,
        percentage: item.percentage,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export type VisibilityScoresBarChartItem = {
  id: string;
  name: string;
  iconUrl?: string;
  percentage: number; // 0-100
};

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value));

export default function VisibilityScoresBarChart({
  items,
  highlightId,
}: {
  items: VisibilityScoresBarChartItem[];
  highlightId?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const isHighlighted = item.id === highlightId;
        const percentage = clampPercentage(item.percentage);

        return (
          <div key={item.id} className="flex items-center gap-3">
            <Favicon
              url={item.iconUrl}
              alt={item.name}
              brandId={item.id}
              color={isHighlighted ? PROJECT_BRAND_COLOR : undefined}
              className="size-9"
            />

            <div className="relative h-9 flex-1 overflow-hidden rounded-lg">
              <div
                className={cx(
                  'h-full rounded-lg',
                  isHighlighted ? 'bg-success-secondary' : 'bg-tertiary'
                )}
                style={{ width: `${percentage}%` }}
              />

              <div className="absolute inset-0 flex items-center gap-2 px-4">
                <div className="text-primary truncate text-sm font-medium">{item.name}</div>
                <div className="text-tertiary mt-0.5 text-xs">{Math.floor(percentage)}%</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
