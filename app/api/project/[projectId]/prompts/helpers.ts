import { getTopicRowsWithProjectId, insertTopicRow } from '@/libs/database/Topics/queries';
import { CUSTOM_TOPIC_NAME } from '@/libs/database/Topics/types';

export async function findOrCreateCustomTopic(projectId: string, userId: string) {
  // Find custom topic
  const topicRows = await getTopicRowsWithProjectId(projectId);
  if (!topicRows.length) throw new Error('Failed to get topics');
  const topicRow = topicRows.find((t) => t.name === CUSTOM_TOPIC_NAME);
  if (topicRow) return topicRow;

  // Create custom topic
  const newTopicRow = await insertTopicRow({
    name: CUSTOM_TOPIC_NAME,
    project_id: projectId,
    author_id: userId,
  });
  if (!newTopicRow) throw new Error('Failed to save topic');

  return newTopicRow;
}
