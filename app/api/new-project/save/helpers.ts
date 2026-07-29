import { PromptAndTopicId, getPartsFromPromptAndTopicId } from '@/libs/utils/PromptAndTopicId';
import { TopicRow } from '@/libs/database/Topics/types';

export function getTopicsMapFromIds(promptsIds: PromptAndTopicId[]): Map<string, string[]> {
  return promptsIds
    .map((promptId) => getPartsFromPromptAndTopicId(promptId))
    .reduce((acc, { topic, prompt }) => {
      if (!acc.has(topic)) acc.set(topic, []);
      acc.get(topic)?.push(prompt);
      return acc;
    }, new Map<string, string[]>());
}

export function getPromptsMapFromTopicRows(promptsIds: PromptAndTopicId[], topicRows: TopicRow[]): Map<string, string[]> {
  return promptsIds
    .map((promptId) => getPartsFromPromptAndTopicId(promptId))
    .reduce((acc, { topic, prompt }) => {
      const topicId = topicRows.find((row) => row.name === topic)?.id;
      if (!topicId) throw new Error('Topic not found');
      if (!acc.has(topicId)) acc.set(topicId, []);
      acc.get(topicId)?.push(prompt);
      return acc;
    }, new Map<string, string[]>());
}
