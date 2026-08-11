import { describe, expect, it } from 'bun:test';

import {
  assertResponseIsGrounded,
  getWebSearchQueries,
  isUngroundedResponseError,
  UngroundedResponseError,
} from '@/libs/ai/grounding';

/** The shape `generateText` hands back for a Google call: `providerMetadata.google` carries
 * `GoogleGenerativeAIProviderMetadata`, whose `groundingMetadata.webSearchQueries` lists the
 * searches the model actually ran. */
function googleResponse(webSearchQueries: unknown, modelId = 'gemini-3.1-flash-lite') {
  return {
    providerMetadata: { google: { groundingMetadata: { webSearchQueries } } },
    response: { modelId },
  };
}

describe('getWebSearchQueries', () => {
  it('returns the searches the model ran', () => {
    expect(
      getWebSearchQueries(googleResponse(['best pm tools', 'agency software']).providerMetadata)
    ).toEqual(['best pm tools', 'agency software']);
  });

  it('returns empty for every shape that means "never searched"', () => {
    // Google omits the whole key rather than sending an empty array when the model did not
    // search, and has been observed sending `null` for groundingMetadata itself — all of these
    // are the same fact and must not read as grounded.
    expect(getWebSearchQueries(undefined)).toEqual([]);
    expect(getWebSearchQueries({})).toEqual([]);
    expect(getWebSearchQueries({ google: {} })).toEqual([]);
    expect(getWebSearchQueries({ google: { groundingMetadata: null } })).toEqual([]);
    expect(getWebSearchQueries(googleResponse(undefined).providerMetadata)).toEqual([]);
    expect(getWebSearchQueries(googleResponse(null).providerMetadata)).toEqual([]);
    expect(getWebSearchQueries(googleResponse([]).providerMetadata)).toEqual([]);
  });

  it('drops non-string entries rather than counting them as searches', () => {
    expect(getWebSearchQueries(googleResponse([1, null, 'real query']).providerMetadata)).toEqual([
      'real query',
    ]);
  });
});

describe('assertResponseIsGrounded', () => {
  it('passes a response that ran at least one search', () => {
    expect(() => assertResponseIsGrounded(googleResponse(['best pm tools']))).not.toThrow();
  });

  it('throws UngroundedResponseError, naming the model, when the model never searched', () => {
    // The measured failure mode from issue 25: long, fluent, indistinguishable from a grounded
    // answer, and written entirely from training data.
    let thrown: unknown;
    try {
      assertResponseIsGrounded(googleResponse([]));
    } catch (error) {
      thrown = error;
    }

    expect(isUngroundedResponseError(thrown)).toBe(true);
    expect((thrown as UngroundedResponseError).modelId).toBe('gemini-3.1-flash-lite');
    expect((thrown as Error).message).toContain('gemini-3.1-flash-lite');
    expect((thrown as Error).message).toContain('without searching the web');
  });
});

describe('isUngroundedResponseError', () => {
  it('rejects other errors and non-errors', () => {
    expect(isUngroundedResponseError(new Error('something else'))).toBe(false);
    expect(isUngroundedResponseError(undefined)).toBe(false);
    expect(isUngroundedResponseError({ name: 'UngroundedResponseError' })).toBe(false);
  });
});
