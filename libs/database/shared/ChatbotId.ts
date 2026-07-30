import type { ProviderId } from './ProviderId';

export enum ChatbotId {
  ChatGPT = 'chatgpt',
  GoogleAIOverview = 'google-ai-overview',
  Perplexity = 'perplexity',
}

export const SUPPORTED_CHATBOTS_IDS = [
  ChatbotId.ChatGPT,
  ChatbotId.GoogleAIOverview,
  ChatbotId.Perplexity,
];

export const CHATBOT_DISPLAY_LABELS: Record<ChatbotId, string> = {
  [ChatbotId.ChatGPT]: 'ChatGPT',
  [ChatbotId.GoogleAIOverview]: 'Google AI',
  [ChatbotId.Perplexity]: 'Perplexity',
};

/** Which provider key unlocks each Chatbot (docs/adr/0004-direct-provider-keys-not-a-gateway.md) —
 * used to derive the effective enabled set from the stored selection and the keys present. */
export const CHATBOT_PROVIDER: Record<ChatbotId, ProviderId> = {
  [ChatbotId.ChatGPT]: 'openai',
  [ChatbotId.GoogleAIOverview]: 'google',
  [ChatbotId.Perplexity]: 'perplexity',
};
