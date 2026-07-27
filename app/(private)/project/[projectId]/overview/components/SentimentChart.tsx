import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import {
  ChartLegendContent,
  ChartTooltipContent,
} from '@/components/application/charts/charts-base';
import { cx } from '@/utils/cx';
import { SentimentDataset } from '@/libs/utils/project-analysis/getSentimentDataset';

const SENTIMENT_LABELS: Record<number, string> = {
  [-2]: 'Very Negative',
  [-1]: 'Negative',
  [0]: 'Neutral',
  [1]: 'Positive',
  [2]: 'Very Positive',
};

export default function SentimentChart({
  data,
  displayKeys,
  highlightKey,
  colorMap,
}: {
  data: SentimentDataset;
  displayKeys: string[];
  highlightKey?: string;
  colorMap?: Record<string, string>;
}) {
  return (
    <ResponsiveContainer>
      <AreaChart
        data={data}
        className="text-tertiary [&_.recharts-text]:text-xs"
        margin={{ left: -30, right: 5, bottom: 4, top: 22 }}
      >
        <defs>
          {displayKeys.map((key) => {
            const color = colorMap?.[key];
            return (
              <linearGradient
                key={key}
                id={`sentiment-gradient-${key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={color ?? 'currentColor'}
                  className={color ? undefined : 'text-utility-brand-400'}
                  stopOpacity="1"
                />
                <stop
                  offset="95%"
                  stopColor={color ?? 'currentColor'}
                  className={color ? undefined : 'text-utility-brand-400'}
                  stopOpacity="0.2"
                />
              </linearGradient>
            );
          })}
        </defs>

        <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />

        <YAxis
          domain={[-2, 2]}
          ticks={[-2, -1, 0, 1, 2]}
          tickFormatter={(value: number) => SENTIMENT_LABELS[value] ?? value.toString()}
          axisLine={false}
          tickLine={false}
          width={90}
        />

        <ReferenceLine
          y={0}
          stroke="currentColor"
          className="text-utility-neutral-300"
          strokeDasharray="4 4"
        />

        <Tooltip
          content={<ChartTooltipContent />}
          labelFormatter={(index) =>
            data[index]?.date
              ? new Date(data[index].date).toLocaleString(undefined, {
                  month: 'long',
                  day: 'numeric',
                })
              : 'N/A'
          }
          cursor={{ className: 'stroke-utility-brand-600 stroke-2' }}
          wrapperStyle={{ zIndex: 1 }}
        />

        <Legend
          verticalAlign="bottom"
          content={<ChartLegendContent align="center" />}
          className="pt-4"
        />

        {[...displayKeys]
          .sort((a, b) => (a === highlightKey ? 1 : b === highlightKey ? -1 : 0))
          .map((key) => {
            const brandColor = colorMap?.[key];
            const isHighlighted = key === highlightKey;

            return (
              <Area
                key={key}
                dataKey={key}
                name={key}
                type="natural"
                stroke={brandColor ?? 'currentColor'}
                strokeWidth={2}
                className={
                  brandColor
                    ? '[&_.recharts-area-area]:translate-y-[6px] [&_.recharts-area-area]:[clip-path:inset(0_0_6px_0)]'
                    : cx(
                        '[&_.recharts-area-area]:translate-y-[6px] [&_.recharts-area-area]:[clip-path:inset(0_0_6px_0)]',
                        isHighlighted ? 'text-utility-brand-400' : 'text-utility-neutral-400'
                      )
                }
                activeDot={{
                  fill: brandColor ?? (isHighlighted ? undefined : 'currentColor'),
                  stroke: brandColor ?? undefined,
                  className: brandColor
                    ? undefined
                    : isHighlighted
                      ? 'fill-utility-brand-100 stroke-utility-brand-500'
                      : 'fill-bg-primary stroke-utility-neutral-400',
                }}
                fill={`url(#sentiment-gradient-${key})`}
                fillOpacity={0}
              />
            );
          })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
