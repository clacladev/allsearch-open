import { TopicRow } from '../Topics/types';

export const TABLE_PROMPTS = 'prompts';

export type PromptRow = {
  id: string;
  name: string;
  topic_id: string;
  project_id: string;
  organization_id: string;
  author_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type PromptAndTopicJoinRow = PromptRow & {
  topic_name: TopicRow['name'];
};
