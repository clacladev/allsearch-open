import { promptResponses } from '../schema';

/** Sentiment score: -2 (very negative) to +2 (very positive) */
export type SentimentLevel = -2 | -1 | 0 | 1 | 2;

/** Per-brand sentiment, keyed by brand_id */
export type BrandsSentiment = Record<string, SentimentLevel>;

export type PromptResponseRow = typeof promptResponses.$inferSelect;

/** Lightweight projection of PromptResponseRow for overview/analysis queries (excludes text, model_id, project_id). */
export type PromptResponseSummaryRow = Pick<
  PromptResponseRow,
  'id' | 'brand_ids_ranking' | 'sentiment' | 'chatbot_id' | 'prompt_id' | 'created_at'
>;
