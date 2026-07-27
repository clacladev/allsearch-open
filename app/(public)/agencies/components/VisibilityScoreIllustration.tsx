import { Eye } from '@untitledui/icons';

type IllustrationVariant = 'default' | 'ecommerce';

type VariantData = {
  brands: readonly string[];
  colors: Record<string, string>;
  data: Record<string, number | string>[];
  projectBrand: string;
};

const DEFAULT_VARIANT: VariantData = {
  brands: ['FancyHotel', 'LuxStay', 'PremierSuites', 'EliteResorts'],
  colors: {
    FancyHotel: 'rgb(85 200 145)',
    LuxStay: 'rgb(220 38 38)',
    PremierSuites: 'rgb(37 99 235)',
    EliteResorts: 'rgb(202 133 4)',
  },
  data: [
    { date: 'Jan 27', FancyHotel: 42, LuxStay: 35, PremierSuites: 28, EliteResorts: 20 },
    { date: 'Jan 31', FancyHotel: 45, LuxStay: 32, PremierSuites: 30, EliteResorts: 22 },
    { date: 'Feb 4', FancyHotel: 50, LuxStay: 30, PremierSuites: 32, EliteResorts: 18 },
    { date: 'Feb 8', FancyHotel: 48, LuxStay: 33, PremierSuites: 29, EliteResorts: 24 },
    { date: 'Feb 12', FancyHotel: 55, LuxStay: 28, PremierSuites: 35, EliteResorts: 20 },
    { date: 'Feb 16', FancyHotel: 60, LuxStay: 25, PremierSuites: 33, EliteResorts: 22 },
    { date: 'Feb 20', FancyHotel: 58, LuxStay: 27, PremierSuites: 30, EliteResorts: 19 },
    { date: 'Feb 24', FancyHotel: 62, LuxStay: 24, PremierSuites: 32, EliteResorts: 21 },
  ],
  projectBrand: 'FancyHotel',
};

const ECOMMERCE_VARIANT: VariantData = {
  brands: ['StrideAthlete', 'Nike', 'ASICS', 'NewBalance'],
  colors: {
    StrideAthlete: 'rgb(85 200 145)',
    Nike: 'rgb(234 88 12)',
    ASICS: 'rgb(37 99 235)',
    NewBalance: 'rgb(220 38 38)',
  },
  data: [
    { date: 'Jan 27', StrideAthlete: 42, Nike: 35, ASICS: 28, NewBalance: 20 },
    { date: 'Jan 31', StrideAthlete: 45, Nike: 32, ASICS: 30, NewBalance: 22 },
    { date: 'Feb 4', StrideAthlete: 50, Nike: 30, ASICS: 32, NewBalance: 18 },
    { date: 'Feb 8', StrideAthlete: 48, Nike: 33, ASICS: 29, NewBalance: 24 },
    { date: 'Feb 12', StrideAthlete: 55, Nike: 28, ASICS: 35, NewBalance: 20 },
    { date: 'Feb 16', StrideAthlete: 60, Nike: 25, ASICS: 33, NewBalance: 22 },
    { date: 'Feb 20', StrideAthlete: 58, Nike: 27, ASICS: 30, NewBalance: 19 },
    { date: 'Feb 24', StrideAthlete: 62, Nike: 24, ASICS: 32, NewBalance: 21 },
  ],
  projectBrand: 'StrideAthlete',
};

const VARIANTS: Record<IllustrationVariant, VariantData> = {
  default: DEFAULT_VARIANT,
  ecommerce: ECOMMERCE_VARIANT,
};

const CHART_HEIGHT = 140;
const CHART_WIDTH_RATIO = 100; // percentage
const Y_MAX = 70;

function getYPosition(value: number) {
  return CHART_HEIGHT - (value / Y_MAX) * CHART_HEIGHT;
}

function getPoints(brandKey: string, data: Record<string, number | string>[]) {
  const step = CHART_WIDTH_RATIO / (data.length - 1);
  return data.map((entry, i) => ({
    x: i * step,
    y: getYPosition(entry[brandKey] as number),
  }));
}

function pointsToPolyline(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function pointsToAreaPath(points: { x: number; y: number }[]) {
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return `${line} L${points[points.length - 1].x},${CHART_HEIGHT} L${points[0].x},${CHART_HEIGHT} Z`;
}

const Y_TICKS = [0, 20, 40, 60];

export const VisibilityScoreIllustration = ({
  variant = 'default',
}: {
  variant?: IllustrationVariant;
}) => {
  const v = VARIANTS[variant];
  return (
    <div className="ring-secondary flex flex-col gap-3 rounded-xl px-4 py-3 shadow-xs ring-1">
      <div className="flex items-center gap-2">
        <Eye className="text-tertiary size-4" />
        <span className="text-primary text-sm font-semibold">Visibility score: 62%</span>
      </div>

      <div className="relative" style={{ height: CHART_HEIGHT + 24 }}>
        {/* Y-axis labels and grid lines */}
        {Y_TICKS.map((tick) => {
          const y = getYPosition(tick);
          return (
            <div
              key={tick}
              className="pointer-events-none absolute right-0 left-0"
              style={{ top: y }}
            >
              <span className="text-quaternary absolute -left-0.5 -translate-y-1/2 text-[10px]">
                {tick}%
              </span>
              <div className="bg-secondary absolute right-0 left-6 h-px" />
            </div>
          );
        })}

        {/* Chart area */}
        <svg
          viewBox={`0 0 ${CHART_WIDTH_RATIO} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute top-0 right-0 bottom-6 left-7"
          style={{ width: 'calc(100% - 28px)', height: CHART_HEIGHT }}
        >
          {/* Highlighted brand area fill */}
          <path
            d={pointsToAreaPath(getPoints(v.projectBrand, v.data))}
            fill={v.colors[v.projectBrand]}
            opacity={0.12}
          />

          {/* Lines for each brand */}
          {v.brands.map((brand) => (
            <polyline
              key={brand}
              points={pointsToPolyline(getPoints(brand, v.data))}
              fill="none"
              stroke={v.colors[brand]}
              strokeWidth={brand === v.projectBrand ? 2.5 : 1.5}
              opacity={brand === v.projectBrand ? 1 : 0.6}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* X-axis labels */}
        <div
          className="absolute right-0 bottom-0 left-7 flex justify-between"
          style={{ width: 'calc(100% - 28px)' }}
        >
          {v.data
            .filter((_, i) => i % 2 === 0)
            .map((entry) => (
              <span key={entry.date as string} className="text-quaternary text-[10px]">
                {entry.date as string}
              </span>
            ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {v.brands.map((brand) => (
          <div key={brand} className="flex items-center gap-1.5">
            <div className="size-2 rounded-full" style={{ backgroundColor: v.colors[brand] }} />
            <span className="text-tertiary text-[10px]">{brand}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
