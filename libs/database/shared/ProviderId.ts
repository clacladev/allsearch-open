// Lives here rather than in libs/ai/models.ts (which re-exports it) so libs/database/schema.ts
// can reference it without importing from libs/ai/ — that direction would cycle back through
// libs/database/Settings/queries.ts, which libs/ai/models.ts depends on for key storage.
export type ProviderId = 'openai' | 'google' | 'perplexity';
