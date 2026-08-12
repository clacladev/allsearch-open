'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
      className="flex w-auto items-center gap-3"
    >
      {CHART_VARIANTS.map((item) => (
        <label
          key={item.chartType}
          className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs"
        >
          <RadioGroupItem key={item.chartType} value={item.chartType} aria-label={item.label} />
          {item.label}
        </label>
      ))}
    </RadioGroup>
  );
}
