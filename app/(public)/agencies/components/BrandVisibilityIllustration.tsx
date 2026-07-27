import { BarChart11 } from '@untitledui/icons';

type BrandRow = {
  name: string;
  initials: string;
  percentage: number;
  color: string;
  isProject: boolean;
};

const DEFAULT_BRANDS: BrandRow[] = [
  { name: 'FancyHotel', initials: 'FH', percentage: 62, color: 'rgb(85 200 145)', isProject: true },
  { name: 'LuxStay', initials: 'LS', percentage: 45, color: 'rgb(220 38 38)', isProject: false },
  {
    name: 'PremierSuites',
    initials: 'PS',
    percentage: 34,
    color: 'rgb(37 99 235)',
    isProject: false,
  },
  {
    name: 'EliteResorts',
    initials: 'ER',
    percentage: 21,
    color: 'rgb(202 133 4)',
    isProject: false,
  },
];

const ECOMMERCE_BRANDS: BrandRow[] = [
  {
    name: 'StrideAthlete',
    initials: 'SA',
    percentage: 62,
    color: 'rgb(85 200 145)',
    isProject: true,
  },
  { name: 'Nike', initials: 'NK', percentage: 45, color: 'rgb(234 88 12)', isProject: false },
  { name: 'ASICS', initials: 'AS', percentage: 34, color: 'rgb(37 99 235)', isProject: false },
  { name: 'NewBalance', initials: 'NB', percentage: 21, color: 'rgb(220 38 38)', isProject: false },
];

const VARIANT_BRANDS: Record<string, BrandRow[]> = {
  default: DEFAULT_BRANDS,
  ecommerce: ECOMMERCE_BRANDS,
};

export const BrandVisibilityIllustration = ({
  variant = 'default',
}: {
  variant?: 'default' | 'ecommerce';
}) => (
  <div className="ring-secondary flex flex-col gap-3 rounded-xl px-4 py-3 shadow-xs ring-1">
    <div className="flex items-center gap-2">
      <BarChart11 className="text-tertiary size-4" />
      <span className="text-primary text-sm font-semibold">Brand visibility</span>
    </div>

    <div className="flex flex-col gap-2">
      {(VARIANT_BRANDS[variant] ?? DEFAULT_BRANDS).map((brand) => (
        <div key={brand.name} className="flex items-center gap-3">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: brand.color }}
          >
            <span className="text-[10px] font-semibold text-white">{brand.initials}</span>
          </div>

          <div className="relative h-8 flex-1 overflow-hidden rounded-lg">
            <div
              className={
                brand.isProject
                  ? 'bg-success-secondary h-full rounded-lg'
                  : 'bg-tertiary h-full rounded-lg'
              }
              style={{ width: `${brand.percentage}%` }}
            />
            <div className="absolute inset-0 flex items-center gap-2 px-3">
              <span className="text-primary truncate text-xs font-medium">{brand.name}</span>
              <span className="text-secondary text-[10px]">{brand.percentage}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
