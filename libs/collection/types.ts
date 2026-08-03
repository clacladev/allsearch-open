import { SourceItem } from '@/libs/database/Sources/types';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';

export type ProcessPromptResponse = {
  chatbotId: ChatbotId;
  modelId: string;
  text: string;
  sources: SourceItem[];
  brandIdsRanking: string[];
};
