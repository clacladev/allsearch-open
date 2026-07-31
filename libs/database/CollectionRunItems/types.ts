import { collectionRunItems } from '../schema';
import { ChatbotId } from '../shared/ChatbotId';

export type CollectionRunItemRow = typeof collectionRunItems.$inferSelect;

export type CollectionRunItemStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/** One Prompt's still-pending items, grouped for a single claim — the claim/execution unit is a
 * Prompt (all its enabled Chatbots together), preserving today's per-prompt grouping. */
export type PendingCollectionRunPromptGroup = {
  projectId: string;
  promptId: string;
  promptName: string;
  chatbotIds: ChatbotId[];
};

export type CollectionRunItemStatusCounts = Record<CollectionRunItemStatus, number>;
