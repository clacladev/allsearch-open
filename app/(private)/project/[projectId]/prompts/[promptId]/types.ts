import { BrandsSentiment } from '@/libs/database/PromptResponses/types';
import { SourceItem } from '@/libs/database/Sources/types';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';

export type PromptResponseContent = {
  id: string;
  text: string;
  chatbotId: ChatbotId;
  projectIdRank: number;
  brandIdsRanking: string[];
  sources: SourceItem[];
  sentiment: BrandsSentiment | undefined;
  createdAt: string;
};
