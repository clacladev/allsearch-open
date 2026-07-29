import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createPerplexity } from '@ai-sdk/perplexity';

import { getProviderKeyFromStorage } from '@/libs/database/Settings/queries';
import type { ProviderId } from '@/libs/database/shared/ProviderId';

// Re-exported so existing importers of `ProviderId` from this module keep working — the type
// itself now lives in libs/database/shared/ProviderId.ts, since this file needs to depend on
// libs/database/Settings/queries.ts and a database-owned type can't depend back on libs/ai/.
export type { ProviderId };

const PROVIDER_ENV_VAR: Record<ProviderId, string> = {
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
};

export class MissingProviderKeyError extends Error {
  constructor(public readonly provider: ProviderId) {
    super(`No API key configured for ${provider}. Add one in Settings.`);
    this.name = 'MissingProviderKeyError';
  }
}

/**
 * Storage-first: the database (libs/database/Settings) is the supported home for provider keys,
 * editable at runtime from Settings. The environment variable is a dev-only fallback — useful for
 * `bun run verify:providers` and local development — used only when storage has no key at all.
 */
export async function getProviderKey(provider: ProviderId): Promise<string> {
  const storedKey = await getProviderKeyFromStorage(provider);
  if (storedKey) return storedKey;

  const envKey = process.env[PROVIDER_ENV_VAR[provider]]?.trim();
  if (!envKey) throw new MissingProviderKeyError(provider);
  return envKey;
}

// Provider instances are still not cached across calls: keys are mutable at runtime (editable in
// Settings), and a cached client would hold a stale key after the user edits or removes it.

export async function openaiModel(modelId: string) {
  const apiKey = await getProviderKey('openai');
  return createOpenAI({ apiKey })(modelId);
}

export async function googleModel(modelId: string) {
  const apiKey = await getProviderKey('google');
  return createGoogleGenerativeAI({ apiKey })(modelId);
}

export async function perplexityModel(modelId: string) {
  const apiKey = await getProviderKey('perplexity');
  return createPerplexity({ apiKey })(modelId);
}
