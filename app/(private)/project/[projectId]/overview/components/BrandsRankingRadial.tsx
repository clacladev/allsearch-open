import { OverviewData } from '@/libs/utils/project-analysis/getOverviewData';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { toOrdinal } from '@/libs/numberFormatters';
import { cx } from '@/utils/cx';
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';
import { getBrandColor, PROJECT_BRAND_COLOR } from '@/libs/utils/brandColor';

export function getBrandsRankingRadialData(
  data: OverviewData | undefined
): BrandsRankingRadialItem[] {
  if (!data || !data.brands.length) return [];
  const brandsCount = data.brands.length;
  const positionWeight = 100 / brandsCount;
  return data.rankingsSummary.map((brand, index) => ({
    id: brand.brandId,
    ranking: index,
    brand: brand.isProject ? `${brand.label} (You)` : (brand.label ?? 'Unknown'),
    value: Math.round((brandsCount - index) * positionWeight),
    fill: brand.isProject ? PROJECT_BRAND_COLOR : getBrandColor(brand.brandId),
  }));
}

export type BrandsRankingRadialItem = {
  id: string;
  ranking: number;
  brand: string;
  value: number; // 0-100 (percentage)
  fill: string;
};

export default function BrandsRankingRadial({
  data,
  highlightId,
}: {
  data: BrandsRankingRadialItem[];
  highlightId?: string;
}) {
  const highlightItem = data.find((item) => item.id === highlightId);
  const config = Object.fromEntries(
    data.map((item) => [item.id, { label: item.brand, color: item.fill }])
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
      <RadialBarChart
        data={data}
        accessibilityLayer
        innerRadius="40"
        outerRadius="90"
        startAngle={90}
        endAngle={360 + 90}
        className="text-tertiary [&_.recharts-polar-grid]:text-utility-neutral-100 font-medium [&_.recharts-text]:text-sm"
      >
        <PolarAngleAxis tick={false} domain={[0, 100]} type="number" reversed />
        <ChartTooltip
          isAnimationActive={false}
          content={
            <ChartTooltipContent
              formatter={(_, __, item) => {
                const radialItem: BrandsRankingRadialItem = item?.payload.payload;
                return `${radialItem.brand}: ${toOrdinal(radialItem.ranking + 1)}`;
              }}
              label="Ranking"
            />
          }
        />
        <RadialBar
          dataKey="value"
          cornerRadius={99}
          background={{ className: 'fill-utility-neutral-100' }}
          isAnimationActive={false}
        />
        {!!highlightItem && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
            <tspan
              x="50%"
              dy="-1em"
              className={cx('text-tertiary fill-current', 'text-xs font-medium')}
            >
              You rank
            </tspan>

            <tspan
              x="50%"
              dy="1em"
              className="text-primary text-display-xs fill-current font-semibold"
            >
              {toOrdinal(highlightItem.ranking + 1)}
            </tspan>
          </text>
        )}{' '}
      </RadialBarChart>
    </ChartContainer>
  );
}
