'use client';

import { ButtonGroup, ButtonGroupItem } from '@/components/base/button-group/button-group';
import { Dot } from '@/components/foundations/dot-icon';
import { cx } from '@/utils/cx';

export type OverviewChartType = 'visibility' | 'sentiment';

const CHART_VARIANTS: { chartType: OverviewChartType; label: string }[] = [
  { chartType: 'visibility', label: 'Visibility' },
  { chartType: 'sentiment', label: 'Sentiment' },
];

export default function OverviewChartTypeGroup({
  size = 'xs',
  chartType,
  onChartTypeChangeAction,
}: {
  size?: 'xs' | 'sm';
  chartType: OverviewChartType;
  onChartTypeChangeAction: (chartType: OverviewChartType) => void;
}) {
  return (
    <ButtonGroup selectedKeys={[chartType]} size={size}>
      {CHART_VARIANTS.map((item) => (
        <ButtonGroupItem
          key={item.chartType}
          id={item.chartType}
          iconLeading={
            <Dot
              className={cx(
                'mx-0.75 size-2',
                chartType === item.chartType ? 'text-fg-success-secondary' : 'text-fg-tertiary'
              )}
            />
          }
          onClick={() => onChartTypeChangeAction(item.chartType)}
        >
          {item.label}
        </ButtonGroupItem>
      ))}
    </ButtonGroup>
  );
}
