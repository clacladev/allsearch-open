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
