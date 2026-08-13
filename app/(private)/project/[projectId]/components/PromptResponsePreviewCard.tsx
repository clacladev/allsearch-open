import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { BrandPositionBadge } from '../sources/components/BrandPositionBadge';
import { BrandsIconsStackWithTooltip } from '../sources/components/BrandsIconsStack';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ChatbotLogoImage } from './ChatbotLogoImage';
import { SentimentIcon } from './SentimentIcon';
import { PromptResponseContent } from '../prompts/[promptId]/types';

dayjs.extend(relativeTime);

export const PromptResponsePreviewCard = ({
  project,
  competitors,
  promptResponse,
  onSelect,
}: {
  project: ProjectRow;
  competitors: CompetitorRow[];
  promptResponse: PromptResponseContent;
  onSelect: (response: PromptResponseContent) => void;
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() => onSelect(promptResponse)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(promptResponse);
      }
    }}
    className="border-[color:var(--color-border-secondary)] bg-primary hover:bg-primary_hover flex cursor-pointer flex-col rounded-xl border text-left shadow-xs transition-colors"
  >
    <div className="flex flex-col gap-1 px-4 pt-4 pb-3">
      <p className="text-tertiary text-xs font-medium">
        {dayjs(promptResponse.createdAt).fromNow()}
      </p>
      <p className="text-secondary line-clamp-3 text-sm">{promptResponse.text}</p>
    </div>

    <div className="border-t border-[color:var(--color-border-secondary)] flex items-center justify-between px-4 py-2">
      <div className="flex h-6 items-center gap-2 text-xs font-medium">
        <ChatbotLogoImage chatbotId={promptResponse.chatbotId} />
        <BrandPositionBadge projectIdRank={promptResponse.projectIdRank} />
        <SentimentIcon score={promptResponse.sentiment?.[project.id]} tooltipVariant="long" />
      </div>
      <BrandsIconsStackWithTooltip
        brandIdsRanking={promptResponse.brandIdsRanking}
        competitors={competitors}
        project={project}
      />
    </div>
  </div>
);
