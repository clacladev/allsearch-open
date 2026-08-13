'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Circle } from 'lucide-react';
import { cn } from '@/libs/utils/cn';

export type OverviewChartType = 'visibility' | 'sentiment';

const CHART_VARIANTS: { chartType: OverviewChartType; label: string }[] = [
  { chartType: 'visibility', label: 'Visibility' },
  { chartType: 'sentiment', label: 'Sentiment' },
];

export default function OverviewChartTypeGroup({
  chartType,
  onChartTypeChangeAction,
}: {
  chartType: OverviewChartType;
  onChartTypeChangeAction: (chartType: OverviewChartType) => void;
}) {
  return (
    <ToggleGroup
      value={[chartType]}
      onValueChange={(value) => {
        const nextChartType = value[0] as OverviewChartType | undefined;
        if (nextChartType) onChartTypeChangeAction(nextChartType);
      }}
      variant="outline"
      size="sm"
      spacing={0}
      aria-label="Chart type"
    >
      {CHART_VARIANTS.map((item) => (
        <ToggleGroupItem key={item.chartType} value={item.chartType}>
          <Circle
            aria-hidden="true"
            className={cn(
              'mr-1 size-2 fill-current',
              chartType === item.chartType ? 'text-fg-success-secondary' : 'text-fg-tertiary'
            )}
          />
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
