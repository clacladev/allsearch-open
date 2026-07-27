export type PromptAndTopicId = `${string}:${string}`;

export function getPromptAndTopicId(topic: string, prompt: string): PromptAndTopicId {
  return `${topic}:${prompt}`;
}

export function getPartsFromPromptAndTopicId(promptAndTopicId: PromptAndTopicId) {
  const index = promptAndTopicId.indexOf(':');
  if (index === -1) throw new Error('Invalid prompt and topic id');
  return {
    topic: promptAndTopicId.substring(0, index),
    prompt: promptAndTopicId.substring(index + 1),
  };
}
