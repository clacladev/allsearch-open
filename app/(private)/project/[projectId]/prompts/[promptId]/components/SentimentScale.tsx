import { BrandsSentiment, SentimentLevel } from '@/libs/database/PromptResponses/types';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { ProjectIcon } from '@/app/(private)/components/project/ProjectIcon';
import { Tooltip } from '@/app/(private)/components/Tooltip';
import { getSentimentLabel } from '../../../components/SentimentIcon';
import { PROJECT_BRAND_COLOR, getBrandColor } from '@/libs/utils/brandColor';
import { cx } from '@/utils/cx';

const SENTIMENT_LEVELS: SentimentLevel[] = [-2, -1, 0, 1, 2];

const LEVEL_LABELS: Record<SentimentLevel, string> = {
  [-2]: 'Very Negative',
  [-1]: 'Negative',
  [0]: 'Neutral',
  [1]: 'Positive',
  [2]: 'Very Positive',
};

type BrandSentimentEntry = {
  id: string;
  name: string;
  iconUrl: string | undefined;
  isProject: boolean;
  level: SentimentLevel;
};

export function SentimentScale({
  sentiment,
  project,
  competitors,
}: {
  sentiment: BrandsSentiment;
  project: ProjectRow;
  competitors: CompetitorRow[];
}) {
  const entries: BrandSentimentEntry[] = [];

  if (sentiment[project.id] !== undefined) {
    entries.push({
      id: project.id,
      name: project.name,
      iconUrl: project.icon_url || undefined,
      isProject: true,
      level: sentiment[project.id],
    });
  }

  competitors.forEach((competitor) => {
    if (sentiment[competitor.id] !== undefined) {
      entries.push({
        id: competitor.id,
        name: competitor.name ?? competitor.hostname,
        iconUrl: competitor.icon_url || undefined,
        isProject: false,
        level: sentiment[competitor.id],
      });
    }
  });

  if (!entries.length) return null;

  // Group entries by level, prioritizing project brand first
  const entriesByLevel = new Map<SentimentLevel, BrandSentimentEntry[]>();
  SENTIMENT_LEVELS.forEach((level) => entriesByLevel.set(level, []));
  entries.forEach((entry) => entriesByLevel.get(entry.level)?.push(entry));
  // Sort each group so project brand comes first
  entriesByLevel.forEach((group) => group.sort((a, b) => (a.isProject ? -1 : b.isProject ? 1 : 0)));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-tertiary text-xs font-medium">Sentiment</p>
      <div className="flex items-end justify-between gap-1">
        {SENTIMENT_LEVELS.map((level) => {
          const brandsAtLevel = entriesByLevel.get(level) ?? [];
          return (
            <div key={level} className="flex flex-1 flex-col items-center gap-1.5">
              <BrandsAtLevelDisplay brands={brandsAtLevel} project={project} />
              <div
                className={cx(
                  'h-1.5 w-full rounded-full',
                  level <= -2
                    ? 'bg-error-secondary'
                    : level <= -1
                      ? 'bg-warning-secondary'
                      : level === 0
                        ? 'bg-tertiary'
                        : level === 1
                          ? 'bg-success-secondary'
                          : 'bg-success-primary'
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between">
        <span className="text-quaternary text-[10px]">{LEVEL_LABELS[-2]}</span>
        <span className="text-quaternary text-[10px]">{LEVEL_LABELS[0]}</span>
        <span className="text-quaternary text-[10px]">{LEVEL_LABELS[2]}</span>
      </div>
    </div>
  );
}

function BrandsAtLevelDisplay({
  brands,
  project,
}: {
  brands: BrandSentimentEntry[];
  project: ProjectRow;
}) {
  if (!brands.length) return <div className="h-6" />;

  // Single brand: show it directly
  if (brands.length === 1) {
    const brand = brands[0];
    return (
      <Tooltip title={getSentimentLabel(brand.level)} description={brand.name}>
        <ProjectIcon
          size="xs"
          className="ring-bg-primary ring-[1.5px]"
          alt={brand.name}
          src={brand.iconUrl}
          placeholder={brand.name.slice(0, 2)}
          color={brand.id === project.id ? PROJECT_BRAND_COLOR : getBrandColor(brand.id)}
        />
      </Tooltip>
    );
  }

  // Multiple brands: show first icon + "+N" as a stack
  const first = brands[0];
  const remaining = brands.length - 1;
  const tooltipDescription = brands.map((b) => b.name).join(', ');

  return (
    <Tooltip title={LEVEL_LABELS[first.level]} description={tooltipDescription}>
      <div className="flex -space-x-2">
        <ProjectIcon
          size="xs"
          className="ring-bg-primary ring-[1.5px]"
          alt={first.name}
          src={first.iconUrl}
          placeholder={(first.name ?? '').slice(0, 2)}
          color={first.id === project.id ? PROJECT_BRAND_COLOR : getBrandColor(first.id)}
        />
        <ProjectIcon
          size="xs"
          className="ring-bg-primary ring-[1.5px]"
          placeholder={`+${remaining}`}
        />
      </div>
    </Tooltip>
  );
}
