import { BadgeWithDot } from '@/components/base/badges/badges';
import { CheckCircleBroken, Star01 } from '@untitledui/icons';
import type { BadgeColors } from '@/components/base/badges/badge-types';
import { cx } from '@/utils/cx';

type SourceIllustrationRow = {
  title: string;
  url: string;
  category: string;
  categoryColor: BadgeColors;
  usedPercentage: number;
  citedPercentage: number;
  mention: number | null;
  brands?: string[];
};

const DEFAULT_SOURCES: SourceIllustrationRow[] = [
  {
    title: 'Best Luxury Residences in Miami — The Definitive Guide',
    url: 'fancyhotel.com/us/a/best-luxury-residences-in-miami',
    category: 'You',
    categoryColor: 'blue',
    usedPercentage: 78,
    citedPercentage: 62,
    mention: 0,
    brands: ['you', 'RS', 'MW'],
  },
  {
    title: 'Where Should I Go on Holiday in 2026?',
    url: 'fivestar.com/where-should-i-go-on-holiday-in-2026',
    category: 'Editorial',
    categoryColor: 'purple',
    usedPercentage: 65,
    citedPercentage: 45,
    mention: 2,
    brands: ['RS', 'FS', 'you'],
  },
  {
    title: 'Top 10 Beach Resorts According to Travelers',
    url: 'reddit.com/r/Hotels/comments/1lqk1mg',
    category: 'UGC',
    categoryColor: 'orange',
    usedPercentage: 52,
    citedPercentage: 30,
    mention: null,
  },
  {
    title: 'Luxury Hotel Awards 2026 — Official Rankings',
    url: 'travelawards.org/luxury-hotel-awards-2026',
    category: 'Institutional',
    categoryColor: 'pink',
    usedPercentage: 44,
    citedPercentage: 38,
    mention: 3,
    brands: ['RS', 'MW', 'FS', 'you'],
  },
  {
    title: 'How to Choose the Best Resort for Families',
    url: 'tripadvisor.com/ShowTopic-g60763-i5-k15234567',
    category: 'UGC',
    categoryColor: 'orange',
    usedPercentage: 38,
    citedPercentage: 22,
    mention: null,
    brands: ['MW'],
  },
];

const ECOMMERCE_SOURCES: SourceIllustrationRow[] = [
  {
    title: 'Best Running Shoes 2026 — Expert Buyer\u2019s Guide',
    url: 'strideathlete.com/guides/best-running-shoes-2026',
    category: 'You',
    categoryColor: 'blue',
    usedPercentage: 78,
    citedPercentage: 62,
    mention: 0,
    brands: ['you', 'NK', 'AS'],
  },
  {
    title: 'Best GPS Running Watches for Every Budget — Full Review',
    url: 'runnersworld.com/gear/best-gps-watches-runners',
    category: 'Editorial',
    categoryColor: 'purple',
    usedPercentage: 65,
    citedPercentage: 45,
    mention: 2,
    brands: ['NK', 'AS', 'you'],
  },
  {
    title: 'What trail running shoes do you actually recommend?',
    url: 'reddit.com/r/running/comments/8xy9ab0',
    category: 'UGC',
    categoryColor: 'orange',
    usedPercentage: 52,
    citedPercentage: 30,
    mention: null,
  },
  {
    title: 'Running Gear Awards 2026 — Editor\u2019s Picks',
    url: 'runnersworld.com/running-gear-awards-2026',
    category: 'Institutional',
    categoryColor: 'pink',
    usedPercentage: 44,
    citedPercentage: 38,
    mention: 3,
    brands: ['NK', 'AS', 'NB', 'you'],
  },
  {
    title: 'Best compression socks for long runs — real runner reviews',
    url: 'reddit.com/r/AdvancedRunning/comments/4mn5op6',
    category: 'UGC',
    categoryColor: 'orange',
    usedPercentage: 38,
    citedPercentage: 22,
    mention: null,
    brands: ['AS'],
  },
];

const VARIANT_SOURCES: Record<string, SourceIllustrationRow[]> = {
  default: DEFAULT_SOURCES,
  ecommerce: ECOMMERCE_SOURCES,
};

const BRAND_COLORS: Record<string, string> = {
  RS: 'bg-blue-600 text-white',
  MW: 'bg-emerald-600 text-white',
  FS: 'bg-purple-600 text-white',
  NK: 'bg-orange-600 text-white',
  AS: 'bg-blue-600 text-white',
  NB: 'bg-red-600 text-white',
};

const YouBadge = () => (
  <div className="border-primary flex h-5 w-5 items-center justify-center rounded border bg-amber-700">
    <Star01 className="text-white" size={10} />
  </div>
);

const BrandBadge = ({ brand }: { brand: string }) =>
  brand === 'you' ? (
    <YouBadge />
  ) : (
    <div
      className={cx(
        'border-primary flex h-5 w-5 items-center justify-center rounded border text-[9px] font-semibold',
        BRAND_COLORS[brand] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
      )}
    >
      {brand}
    </div>
  );

function toOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const ProgressBar = ({ value }: { value: number }) => (
  <div className="bg-quaternary h-1.5 w-10 overflow-hidden rounded-full">
    <div className="bg-fg-brand-primary h-full rounded-full" style={{ width: `${value}%` }} />
  </div>
);

export const SourcesIllustration = ({
  variant = 'default',
}: {
  variant?: 'default' | 'ecommerce';
}) => (
  <div className="bg-primary ring-secondary overflow-hidden rounded-2xl ring-1">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-secondary/30 border-secondary border-b">
          <tr>
            <th className="text-tertiary px-4 py-2 text-xs font-medium">URL</th>
            <th className="text-tertiary px-2 py-2 text-xs font-medium">Category</th>
            <th className="text-tertiary px-2 py-2 text-xs font-medium">Used %</th>
            <th className="text-tertiary px-2 py-2 text-xs font-medium">Cited %</th>
            <th className="text-tertiary px-2 py-2 text-xs font-medium">Mention</th>
            <th className="text-tertiary px-4 py-2 text-xs font-medium">Brands</th>
          </tr>
        </thead>
        <tbody>
          {(VARIANT_SOURCES[variant] ?? DEFAULT_SOURCES).map((row) => (
            <tr key={row.url} className="border-secondary border-b last:border-b-0">
              <td className="px-4 py-2.5">
                <div className="max-w-56">
                  <p className="text-primary truncate text-xs font-medium">{row.title}</p>
                  <p className="text-secondary truncate text-xs">{row.url}</p>
                </div>
              </td>
              <td className="px-2 py-2.5 whitespace-nowrap">
                <BadgeWithDot size="sm" color={row.categoryColor} type="modern">
                  {row.category}
                </BadgeWithDot>
              </td>
              <td className="px-2 py-2.5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-tertiary text-xs">{row.usedPercentage}%</span>
                  <ProgressBar value={row.usedPercentage} />
                </div>
              </td>
              <td className="px-2 py-2.5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-tertiary text-xs">{row.citedPercentage}%</span>
                  <ProgressBar value={row.citedPercentage} />
                </div>
              </td>
              <td className="px-2 py-2.5 whitespace-nowrap">
                {row.mention !== null ? (
                  <div className="flex items-center gap-1.5">
                    <CheckCircleBroken className="text-brand-secondary" size={14} />
                    <span className="text-tertiary text-xs">{toOrdinal(row.mention + 1)}</span>
                  </div>
                ) : (
                  <span className="text-quaternary text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {row.brands ? (
                  <div className="flex -space-x-1">
                    {row.brands.map((brand) => (
                      <BrandBadge key={brand} brand={brand} />
                    ))}
                  </div>
                ) : (
                  <span className="text-quaternary text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
