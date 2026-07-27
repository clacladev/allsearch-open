import { ChatbotId } from '../shared/ChatbotId';

export const TABLE_PROMPT_RESPONSES = 'prompt_responses';

/** Sentiment score: -2 (very negative) to +2 (very positive) */
export type SentimentLevel = -2 | -1 | 0 | 1 | 2;

/** Per-brand sentiment, keyed by brand_id */
export type BrandsSentiment = Record<string, SentimentLevel>;

export type PromptResponseRow = {
  id: string;
  text: string;
  brand_ids_ranking: string[];
  sentiment: BrandsSentiment | undefined;
  model_id: string;
  chatbot_id: ChatbotId;
  prompt_id: string;
  project_id: string;
  workflow_id: string;
  created_at: string;
};

/** Lightweight projection of PromptResponseRow for overview/analysis queries (excludes text, model_id, project_id, workflow_id). */
export type PromptResponseSummaryRow = Pick<
  PromptResponseRow,
  'id' | 'brand_ids_ranking' | 'sentiment' | 'chatbot_id' | 'prompt_id' | 'created_at'
>;
