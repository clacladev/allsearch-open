import { prompts } from '../schema';
import { TopicRow } from '../Topics/types';

export type PromptRow = typeof prompts.$inferSelect;

export type PromptAndTopicJoinRow = PromptRow & {
  topic_name: TopicRow['name'];
};
