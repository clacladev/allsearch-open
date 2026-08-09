import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import {
  ChartLegendContent,
  ChartTooltipContent,
} from '@/components/application/charts/charts-base';
import { cx } from '@/utils/cx';
import type { VisibilityDataset } from '@/libs/utils/project-analysis/getVisibilityDataset';

export default function VisibilityChart({
  data,
  displayKeys,
  highlightKey,
  colorMap,
}: {
  data: VisibilityDataset;
  displayKeys: string[];
  highlightKey?: string;
  /** Maps brand label → brand color (oklch string). Used to color each brand's line. */
  colorMap?: Record<string, string>;
}) {
  return (
    <ResponsiveContainer>
      <AreaChart
        data={data}
        className="text-tertiary [&_.recharts-text]:text-xs"
        margin={{
          left: 5,
          right: 5,
          bottom: 4,
          top: 22,
        }}
      >
        <defs>
          {displayKeys.map((key) => {
            const color = colorMap?.[key];
            return (
              <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
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

        {/* Real time scale: points are spaced by elapsed time, not by array position, so a fortnight
            gap looks like a fortnight. Hidden, matching today's chart which renders no x labels.
            The explicit domain is required — a numeric XAxis defaults to [0, 'auto'], which would
            squash every epoch-ms timestamp against the right edge. */}
        <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} hide />

        <Tooltip
          content={<ChartTooltipContent formatter={(value) => `${value}%`} />}
          labelFormatter={(_label, payload) => {
            const date = (payload?.[0]?.payload as { date?: string | null } | undefined)?.date;
            return date
              ? new Date(date).toLocaleString(undefined, {
                  month: 'long',
                  day: 'numeric',
                })
              : 'N/A';
          }}
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
                connectNulls={false}
                dot={{ r: 3, fill: brandColor ?? 'currentColor', stroke: 'none' }}
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
                fill={`url(#gradient-${key})`}
                fillOpacity={isHighlighted ? 0.2 : 0}
              />
            );
          })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
