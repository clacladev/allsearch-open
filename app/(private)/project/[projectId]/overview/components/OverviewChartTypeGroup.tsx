'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    <RadioGroup
      aria-label="Chart type"
      value={chartType}
      onValueChange={(value) => onChartTypeChangeAction(value as OverviewChartType)}
      className="border-border flex w-auto items-center gap-0 overflow-hidden rounded-md border shadow-xs"
    >
      {CHART_VARIANTS.map((item) => (
        <label
          key={item.chartType}
          className={cn(
            'border-border text-muted-foreground flex h-7 cursor-pointer items-center gap-1.5 border-l px-2 text-xs first:border-l-0',
            chartType === item.chartType && 'bg-muted text-foreground'
          )}
        >
          <RadioGroupItem key={item.chartType} value={item.chartType} aria-label={item.label} />
          {item.label}
        </label>
      ))}
    </RadioGroup>
  );
}
