import { describe, it, expect } from 'bun:test';
import { APICallError } from '@ai-sdk/provider';
import { AiError, aiErrorCodeToStatus, aiErrorToResponseInit, toAiError } from '@/libs/ai/errors';

// Deliberately does NOT import MissingProviderKeyError from '@/libs/ai/models': several other test
// files stub that module at file scope, and while those stubs are now file-scoped (see
// tests/unit/moduleMocks.ts), a look-alike with the same `.name` keeps this file independent of
// them entirely — and matches how libs/ai/errors.ts itself classifies the error (by name, not
// `instanceof`) for exactly that reason.
class FakeMissingProviderKeyError extends Error {
  constructor(public readonly provider: string) {
    super(`No API key configured for ${provider}. Add one in Settings.`);
    this.name = 'MissingProviderKeyError';
  }
}

function apiCallError(statusCode: number | undefined, message = 'Request failed') {
  return new APICallError({
    message,
    url: 'https://example.test',
    requestBodyValues: {},
    statusCode,
  });
}

describe('toAiError', () => {
  it('classifies a MissingProviderKeyError-shaped error as NO_KEY', () => {
    const error = toAiError(new FakeMissingProviderKeyError('google'), 'google');
    expect(error).toBeInstanceOf(AiError);
    expect(error?.code).toBe('NO_KEY');
    expect(error?.provider).toBe('google');
  });

  it('classifies a 401 APICallError as INVALID_KEY', () => {
    const error = toAiError(apiCallError(401), 'openai');
    expect(error?.code).toBe('INVALID_KEY');
    expect(error?.provider).toBe('openai');
  });

  it('classifies a 403 APICallError as INVALID_KEY', () => {
    const error = toAiError(apiCallError(403), 'openai');
    expect(error?.code).toBe('INVALID_KEY');
  });

  it('classifies a 429 APICallError as RATE_LIMITED', () => {
    const error = toAiError(apiCallError(429), 'perplexity');
    expect(error?.code).toBe('RATE_LIMITED');
    expect(error?.provider).toBe('perplexity');
  });

  it('classifies a quota/rate-limit-shaped message as RATE_LIMITED even off a non-429 status', () => {
    const error = toAiError(apiCallError(400, 'You have exceeded your current quota'), 'google');
    expect(error?.code).toBe('RATE_LIMITED');
  });

  it('classifies a rate-limit-worded message as RATE_LIMITED regardless of casing/spacing', () => {
    const error = toAiError(apiCallError(400, 'Rate Limit exceeded, slow down'), 'google');
    expect(error?.code).toBe('RATE_LIMITED');
  });

  it('returns undefined for an APICallError whose status/message is not credential-shaped', () => {
    const error = toAiError(apiCallError(500, 'Internal server error'), 'google');
    expect(error).toBeUndefined();
  });

  it('returns undefined for an unrelated plain error, letting it propagate as-is', () => {
    const error = toAiError(new Error('some unrelated failure'), 'google');
    expect(error).toBeUndefined();
  });

  it('returns undefined for a non-Error thrown value', () => {
    const error = toAiError('a string was thrown', 'google');
    expect(error).toBeUndefined();
  });
});

describe('aiErrorCodeToStatus', () => {
  it('maps NO_KEY to 401', () => {
    expect(aiErrorCodeToStatus('NO_KEY')).toBe(401);
  });

  it('maps INVALID_KEY to 401', () => {
    expect(aiErrorCodeToStatus('INVALID_KEY')).toBe(401);
  });

  it('maps RATE_LIMITED to 429', () => {
    expect(aiErrorCodeToStatus('RATE_LIMITED')).toBe(429);
  });
});

describe('aiErrorToResponseInit', () => {
  it('emits the shape hooks/appFetch.ts parses off a non-ok response, at the mapped status', () => {
    const error = new AiError('INVALID_KEY', 'openai', 'The openai API key was rejected.');
    const { body, status } = aiErrorToResponseInit(error);

    expect(status).toBe(401);
    // appFetch reads `data.error` for the message and `data.code` for the code.
    expect(body.error).toBe('The openai API key was rejected.');
    expect(body.code).toBe('INVALID_KEY');
    expect(body.provider).toBe('openai');
  });
});
