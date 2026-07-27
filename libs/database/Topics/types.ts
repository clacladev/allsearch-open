export const TABLE_TOPICS = 'topics';

export type TopicRow = {
  id: string;
  name: string;
  project_id: string;
  author_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export const CUSTOM_TOPIC_NAME = 'Custom';
