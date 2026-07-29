import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createPerplexity } from '@ai-sdk/perplexity';

export type ProviderId = 'openai' | 'google' | 'perplexity';

const PROVIDER_ENV_VAR: Record<ProviderId, string> = {
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
};

export class MissingProviderKeyError extends Error {
  constructor(public readonly provider: ProviderId) {
    super(`Missing API key for ${provider}: set ${PROVIDER_ENV_VAR[provider]}.`);
    this.name = 'MissingProviderKeyError';
  }
}

/**
 * Async deliberately: issue 08 swaps this body for a database read without
 * changing a single signature. Every call site already awaits it.
 */
export async function getProviderKey(provider: ProviderId): Promise<string> {
  const key = process.env[PROVIDER_ENV_VAR[provider]]?.trim();
  if (!key) throw new MissingProviderKeyError(provider);
  return key;
}

// Provider instances are not cached across calls — issue 08 makes keys
// mutable at runtime, and a cached client would hold a stale key after the
// user edits it.

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
