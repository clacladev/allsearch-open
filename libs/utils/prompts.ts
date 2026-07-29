export const normalizePromptName = (prompt: string) => prompt.trim().toLowerCase();

export function isPromptUnique(allPrompts: string[], newCustomPrompt: string) {
  return !allPrompts.map(normalizePromptName).includes(normalizePromptName(newCustomPrompt));
}
