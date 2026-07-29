import { describe, expect, it, beforeAll, beforeEach, afterEach } from 'bun:test';
import type * as ModelsModule from '@/libs/ai/models';

const ENV_VARS = {
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
} as const;

// Other test files in this suite call mock.module('@/libs/ai/models', ...) at
// file scope (e.g. to stub `googleModel`) and never restore it — Bun's
// mock.module() patches the shared module registry entry in place for the
// rest of the process, keyed by resolved path, and a static import of
// '@/libs/ai/models' in this file would just bind to whatever that entry
// currently holds. So this file cannot assume it sees the real module via a
// normal import. Make it immune instead: fetch a fresh, unpolluted copy once
// via a cache-busted dynamic import (a distinct query string is a distinct
// module instance in Bun, verified empirically) and call through that
// instance directly in every test below, regardless of what any other file
// already did to '@/libs/ai/models'.
let models: typeof ModelsModule;

beforeAll(async () => {
  // @ts-expect-error -- the query string is a deliberate cache-busting
  // specifier (see comment above); it has no matching module declaration.
  models = await import('@/libs/ai/models?fresh-for-models-test');
});

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const envVar of Object.values(ENV_VARS)) {
    originalEnv[envVar] = process.env[envVar];
    delete process.env[envVar];
  }
});

afterEach(() => {
  for (const envVar of Object.values(ENV_VARS)) {
    if (originalEnv[envVar] === undefined) delete process.env[envVar];
    else process.env[envVar] = originalEnv[envVar];
  }
});

describe('getProviderKey', () => {
  it('reads the env var for each provider', async () => {
    process.env[ENV_VARS.openai] = 'openai-key';
    process.env[ENV_VARS.google] = 'google-key';
    process.env[ENV_VARS.perplexity] = 'perplexity-key';

    expect(await models.getProviderKey('openai')).toBe('openai-key');
    expect(await models.getProviderKey('google')).toBe('google-key');
    expect(await models.getProviderKey('perplexity')).toBe('perplexity-key');
  });

  it('throws MissingProviderKeyError with the right provider when the var is unset', async () => {
    await expect(models.getProviderKey('openai')).rejects.toMatchObject({ provider: 'openai' });
  });

  it('throws MissingProviderKeyError when the var is blank / whitespace', async () => {
    process.env[ENV_VARS.google] = '   ';
    await expect(models.getProviderKey('google')).rejects.toMatchObject({ provider: 'google' });
  });
});

describe('openaiModel / googleModel / perplexityModel', () => {
  it('passes the model ID through unprefixed', async () => {
    process.env[ENV_VARS.openai] = 'openai-key';
    process.env[ENV_VARS.google] = 'google-key';
    process.env[ENV_VARS.perplexity] = 'perplexity-key';

    const openai = await models.openaiModel('gpt-5.4-nano');
    const google = await models.googleModel('gemini-3.1-flash-lite');
    const perplexity = await models.perplexityModel('sonar');

    expect(openai.modelId).toBe('gpt-5.4-nano');
    expect(google.modelId).toBe('gemini-3.1-flash-lite');
    expect(perplexity.modelId).toBe('sonar');

    // Proves the configured key actually reaches the constructed model, not
    // just the modelId: @ai-sdk/openai@3's LanguageModelV3 instance carries a
    // `config.headers()` factory that builds the real request headers,
    // including `authorization: Bearer <apiKey>`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openaiConfig = (openai as any).config;
    expect(openaiConfig.headers().authorization).toBe('Bearer openai-key');
  });

  it('throws MissingProviderKeyError for the matching provider when its key is absent', async () => {
    await expect(models.openaiModel('gpt-5.4-nano')).rejects.toBeInstanceOf(
      models.MissingProviderKeyError
    );
    await expect(models.googleModel('gemini-3.1-flash-lite')).rejects.toBeInstanceOf(
      models.MissingProviderKeyError
    );
    await expect(models.perplexityModel('sonar')).rejects.toBeInstanceOf(
      models.MissingProviderKeyError
    );
  });
});
