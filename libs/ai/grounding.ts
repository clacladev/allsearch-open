import type { GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google';

/** Thrown when a Google model answered without running a single web search. The text it produced
 *  came from training data, so it is not a Prompt Response — see `assertResponseIsGrounded`. */
export class UngroundedResponseError extends Error {
  modelId: string;

  constructor(modelId: string) {
    super(
      `${modelId} answered without searching the web, so the response reflects training data ` +
        `rather than what is being said online. It was discarded rather than stored.`
    );
    this.name = 'UngroundedResponseError';
    this.modelId = modelId;
  }
}

/** Matches by `.name` rather than `instanceof`, for the same reason `libs/ai/errors.ts` does:
 *  a test that replaces this module wholesale via `mock.module()` would otherwise leave the real
 *  class unreachable for every other module in the process. */
export function isUngroundedResponseError(error: unknown): error is UngroundedResponseError {
  return error instanceof Error && error.name === 'UngroundedResponseError';
}

/** The searches the model actually ran, straight off `providerMetadata`. Empty (or absent) means
 *  it never searched — this is the only signal Google gives that separates a grounded answer from
 *  a fluent, identical-looking one written from training data (issue 25). */
export function getWebSearchQueries(
  providerMetadata: Record<string, unknown> | undefined
): string[] {
  const google = providerMetadata?.google as GoogleGenerativeAIProviderMetadata | undefined;
  const queries = google?.groundingMetadata?.webSearchQueries;
  if (!Array.isArray(queries)) return [];
  return queries.filter((query): query is string => typeof query === 'string');
}

type GroundableResponse = {
  providerMetadata?: Record<string, unknown> | undefined;
  response: { modelId: string };
};

/**
 * Throws `UngroundedResponseError` unless the model ran at least one web search.
 *
 * Enabling `google_search` permits grounding, it does not guarantee it: the model decides per call
 * and measurably often decides not to (issue 25 — 2 of 3 identical calls came back with no Sources
 * at all), and there is no flag that forces it. An ungrounded answer still names brands — whichever
 * ones the model remembers — so treating it as data does not merely add noise, it biases Visibility
 * towards whatever was popular in the training data. Failing the call is what keeps it out of the
 * database: `callAiWithRetry` retries it within the item's bounded attempt budget, and a Collection
 * Run item that exhausts that budget ends `failed` and retryable rather than silently complete.
 */
export function assertResponseIsGrounded(response: GroundableResponse): void {
  if (getWebSearchQueries(response.providerMetadata).length) return;
  throw new UngroundedResponseError(response.response.modelId);
}
