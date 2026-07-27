import { Badge } from '@/components/base/badges/badges';
import { CheckCircleBroken } from '@untitledui/icons';
import { BADGE_COLORS } from '@/components/base/badges/badge-types';

type PromptIllustrationRow = {
  name: string;
  group: string;
  groupColorIndex: number;
  responses: number;
  mention: number | null; // null = no mention, number = ordinal position (0-indexed)
};

const DEFAULT_PROMPTS: PromptIllustrationRow[] = [
  {
    name: 'Best luxury branded residences for sale in Miami',
    group: 'Branded Residences',
    groupColorIndex: 1,
    responses: 24,
    mention: 0,
  },
  {
    name: 'Top hotels with best spa facilities in Europe',
    group: 'Spa & Wellness',
    groupColorIndex: 4,
    responses: 18,
    mention: 2,
  },
  {
    name: 'Most romantic honeymoon destinations 2026',
    group: 'Travel',
    groupColorIndex: 7,
    responses: 31,
    mention: null,
  },
  {
    name: 'Where should I go on holiday in the Caribbean?',
    group: 'Travel',
    groupColorIndex: 7,
    responses: 12,
    mention: 4,
  },
  {
    name: 'Best all-inclusive luxury resort packages',
    group: 'Branded Residences',
    groupColorIndex: 1,
    responses: 22,
    mention: 1,
  },
];

const ECOMMERCE_PROMPTS: PromptIllustrationRow[] = [
  {
    name: 'Best running shoes for marathon training 2026',
    group: 'Running Shoes',
    groupColorIndex: 1,
    responses: 24,
    mention: 0,
  },
  {
    name: 'Top GPS running watches with heart rate monitor',
    group: 'Running Tech',
    groupColorIndex: 4,
    responses: 18,
    mention: 2,
  },
  {
    name: 'Best moisture-wicking running shirts for summer',
    group: 'Running Apparel',
    groupColorIndex: 7,
    responses: 31,
    mention: null,
  },
  {
    name: 'Where to buy trail running shoes online',
    group: 'Trail Running',
    groupColorIndex: 3,
    responses: 12,
    mention: 4,
  },
  {
    name: 'Best recovery compression socks for runners',
    group: 'Recovery Gear',
    groupColorIndex: 9,
    responses: 22,
    mention: 1,
  },
];

const VARIANT_PROMPTS: Record<string, PromptIllustrationRow[]> = {
  default: DEFAULT_PROMPTS,
  ecommerce: ECOMMERCE_PROMPTS,
};

function toOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const PromptsIllustration = ({
  variant = 'default',
}: {
  variant?: 'default' | 'ecommerce';
}) => (
  <div className="bg-primary ring-secondary overflow-hidden rounded-2xl ring-1">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-secondary/30 border-secondary border-b">
          <tr>
            <th className="text-tertiary px-4 py-2 text-xs font-medium">Prompt</th>
            <th className="text-tertiary px-2 py-2 text-xs font-medium">Group</th>
            <th className="text-tertiary px-2 py-2 text-xs font-medium"># Responses</th>
            <th className="text-tertiary px-4 py-2 text-xs font-medium">Mention</th>
          </tr>
        </thead>
        <tbody>
          {(VARIANT_PROMPTS[variant] ?? DEFAULT_PROMPTS).map((row) => (
            <tr key={row.name} className="border-secondary border-b last:border-b-0">
              <td className="px-4 py-2.5">
                <span className="text-primary max-w-64 truncate text-xs font-medium">
                  {row.name}
                </span>
              </td>
              <td className="px-2 py-2.5 whitespace-nowrap">
                <Badge color={BADGE_COLORS[row.groupColorIndex]} size="sm">
                  {row.group}
                </Badge>
              </td>
              <td className="px-2 py-2.5 whitespace-nowrap">
                <Badge color="gray" size="sm">
                  {row.responses}
                </Badge>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {row.mention !== null ? (
                  <div className="flex items-center gap-1.5">
                    <CheckCircleBroken className="text-brand-secondary" size={14} />
                    <span className="text-tertiary text-xs">{toOrdinal(row.mention + 1)}</span>
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
