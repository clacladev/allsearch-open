import { Favicon } from '@/app/(private)/components/Favicon';
import { OverviewData } from '@/libs/utils/project-analysis/getOverviewData';
import { PROJECT_BRAND_COLOR } from '@/libs/utils/brandColor';
import { cn } from '@/libs/utils/cn';

export type SentimentScoresBarChartItem = {
  id: string;
  name: string;
  iconUrl?: string;
  averageSentiment: number; // -2 to +2
};

export function getSentimentScoresBarChartData(
  data: OverviewData | undefined
): SentimentScoresBarChartItem[] {
  if (!data || !data.sentimentScores.length) return [];
  return data.sentimentScores
    .map((item): SentimentScoresBarChartItem => {
      const brand = data.brands.find((b) => b.brandId === item.brandId);
      return {
        id: item.brandId,
        name: brand?.label ?? item.brandId,
        iconUrl: brand?.iconUrl,
        averageSentiment: item.averageSentiment,
      };
    })
    .sort((a, b) => b.averageSentiment - a.averageSentiment);
}

/** Maps a sentiment score (-2 to +2) to a percentage (0 to 100) for bar width */
function sentimentToPercentage(value: number): number {
  return Math.min(100, Math.max(0, (Math.abs(value) / 2) * 100));
}

export default function SentimentScoresBarChart({
  items,
  highlightId,
}: {
  items: SentimentScoresBarChartItem[];
  highlightId?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const isHighlighted = item.id === highlightId;
        const isPositive = item.averageSentiment >= 0;
        const percentage = sentimentToPercentage(item.averageSentiment);

        return (
          <div key={item.id} className="flex items-center gap-3">
            <Favicon
              url={item.iconUrl}
              alt={item.name}
              brandId={item.id}
              color={isHighlighted ? PROJECT_BRAND_COLOR : undefined}
              className="size-9"
            />

            <div className="relative h-9 flex-1 overflow-hidden rounded-lg">
              <div
                className={cn(
                  'h-full rounded-lg',
                  isPositive
                    ? isHighlighted
                      ? 'bg-success-secondary'
                      : 'bg-tertiary'
                    : isHighlighted
                      ? 'bg-error-secondary'
                      : 'bg-tertiary'
                )}
                style={{ width: `${percentage}%` }}
              />

              <div className="absolute inset-0 flex items-center gap-2 px-4">
                <div className="text-primary truncate text-sm font-medium">{item.name}</div>
                <div className="text-tertiary mt-0.5 text-xs">
                  {item.averageSentiment >= 0 ? '+' : ''}
                  {item.averageSentiment.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
