import { z } from 'zod';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';

export const SetEnabledChatbotIdsBodySchema = z.object({
  chatbotIds: z.array(z.enum(ChatbotId)),
});

export type SetEnabledChatbotIdsResponse = {
  chatbotIds: ChatbotId[] | null;
};
