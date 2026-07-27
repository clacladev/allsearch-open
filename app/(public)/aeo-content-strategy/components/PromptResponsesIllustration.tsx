import { cx } from '@/utils/cx';
import { CheckCircle } from '@untitledui/icons';

type PromptResponseCard = {
  daysAgo: string;
  text: string;
  rank: string;
  brands: string[];
};

const PROMPT_RESPONSE_CARDS: PromptResponseCard[] = [
  {
    daysAgo: '1 days ago',
    text: "Here's an up-to-date, detailed guide to help you choose the best running shoes for marathon training as of early Februa...",
    rank: '1st',
    brands: ['Nk', 'Ad', 'Ho', 'As'],
  },
  {
    daysAgo: '2 days ago',
    text: "Here's a thorough and up-to-date guide (as of February 8, 2026) on choosing the best running shoes for marathon trainin...",
    rank: '3rd',
    brands: ['As', 'Ho', 'Nk'],
  },
  {
    daysAgo: '3 days ago',
    text: "Here's a comprehensive overview of the best running shoes for marathon training as of early February 2026. I've grouped...",
    rank: '1st',
    brands: ['Nk', 'Ne'],
  },
  {
    daysAgo: '4 days ago',
    text: "Here's an updated, well-rounded guide to help you choose the best running shoes for marathon training, tailored to differe...",
    rank: '2nd',
    brands: ['Ho', 'Nk', 'Ad'],
  },
];

const BRAND_COLORS: Record<string, string> = {
  Nk: 'bg-black text-white',
  Ad: 'bg-red-600 text-white',
  Ho: 'bg-blue-600 text-white',
  As: 'bg-blue-400 text-white',
  Ne: 'bg-yellow-400 text-black',
};

const BrandBadge = ({ brand }: { brand: string }) => (
  <div
    className={cx(
      'border-primary flex h-5 w-5 items-center justify-center rounded border text-[9px] font-semibold',
      BRAND_COLORS[brand] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
    )}
  >
    {brand}
  </div>
);

export const PromptResponsesIllustration = () => (
  <div className="bg-primary ring-secondary grid grid-cols-2 gap-2 overflow-hidden rounded-2xl p-3 shadow-xs ring-1">
    {PROMPT_RESPONSE_CARDS.map((card, index) => (
      <div
        key={index}
        className="border-secondary bg-primary flex flex-col rounded-xl border shadow-xs"
      >
        <div className="flex flex-col gap-1 px-3 pt-3 pb-2">
          <p className="text-tertiary text-xs font-medium">{card.daysAgo}</p>
          <p className="text-secondary line-clamp-2 text-xs leading-relaxed">{card.text}</p>
        </div>

        <div className="border-secondary flex items-center justify-between border-t px-3 py-1.5">
          <div className="flex items-center gap-1 text-xs font-medium">
            <CheckCircle className="text-brand-secondary size-3.5" />
            <span className="text-primary">{card.rank}</span>
          </div>
          <div className="flex -space-x-1">
            {card.brands.map((brand, bIndex) => (
              <BrandBadge key={bIndex} brand={brand} />
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);
