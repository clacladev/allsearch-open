import { APICallError } from '@ai-sdk/provider';

import type { ProviderId } from '@/libs/database/shared/ProviderId';
// Type-only: several test files replace '@/libs/ai/models' wholesale via `mock.module()` and
// never restore it (see tests/unit/ai/models.test.ts:10-27), which leaves the real
// `MissingProviderKeyError` class unavailable for the rest of the test process. A runtime
// `import { MissingProviderKeyError }` here would make *this* module — not just a test file —
// fail to link once any such mock has run. `error.name` duck-typing below avoids that dependency
// entirely; `import type` is erased by the compiler (isolatedModules), so it carries no runtime
// import at all.
import type { MissingProviderKeyError } from '@/libs/ai/models';

export type AiErrorCode = 'NO_KEY' | 'INVALID_KEY' | 'RATE_LIMITED' | 'UPSTREAM_ERROR';

/** The credential-shaped subset of {@link AiErrorCode} that client surfaces render the shared
 * credential-failure UI (`AiFailureState`) for. `UPSTREAM_ERROR` is deliberately excluded: it is
 * not something the user can fix by changing their key, so those responses carry a generic
 * message and clients fall back to their own error handling. */
export type CredentialAiErrorCode = Exclude<AiErrorCode, 'UPSTREAM_ERROR'>;

const AI_ERROR_CODES: readonly CredentialAiErrorCode[] = ['NO_KEY', 'INVALID_KEY', 'RATE_LIMITED'];

/** Narrows an arbitrary string (e.g. `AppFetchError.code`, which is typed loosely since it comes
 * off a parsed JSON response body) down to a credential-shaped `AiErrorCode` — the seam every
 * client surface uses to decide whether to render the shared credential-failure UI or fall back to
 * its own generic error handling. */
export function isAiErrorCode(code: string | undefined): code is CredentialAiErrorCode {
  return !!code && (AI_ERROR_CODES as readonly string[]).includes(code);
}

export class AiError extends Error {
  code: AiErrorCode;
  provider: ProviderId;

  constructor(code: AiErrorCode, provider: ProviderId, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'AiError';
    this.code = code;
    this.provider = provider;
  }
}

export function aiErrorCodeToStatus(code: AiErrorCode): number {
  switch (code) {
    case 'NO_KEY':
      return 401;
    case 'INVALID_KEY':
      return 401;
    case 'RATE_LIMITED':
      return 429;
    case 'UPSTREAM_ERROR':
      return 502;
  }
}

// Matches by `.name` rather than `instanceof MissingProviderKeyError` — see the import comment
// above for why. `MissingProviderKeyError` sets `this.name = 'MissingProviderKeyError'`
// (libs/ai/models.ts), the same convention every built-in Error subclass follows.
function isMissingProviderKeyError(error: unknown): error is MissingProviderKeyError {
  return error instanceof Error && error.name === 'MissingProviderKeyError';
}

// Quota/rate-limit errors aren't always surfaced as a clean 429 statusCode — some providers embed
// it in the message instead (e.g. a 400 whose body says "quota exceeded"). Matched case-insensitively
// against whatever text the SDK error carries.
const RATE_LIMIT_MESSAGE_PATTERN = /quota|rate.?limit/i;

/**
 * Classifies an unknown thrown error as an AI-credential problem for the given provider, or
 * returns `undefined` when it isn't one — callers should let those propagate exactly as they do
 * today.
 *
 * Provider SDK calls (`@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/perplexity`) all build on
 * `@ai-sdk/provider-utils`, whose fetch helpers throw `@ai-sdk/provider`'s `APICallError` with a
 * `statusCode` taken directly from the HTTP response for any non-2xx result (verified by reading
 * `node_modules/@ai-sdk/provider-utils/dist/index.mjs`, e.g. `postToApi`'s failure branch, which
 * sets `statusCode: response.status`). `APICallError.isInstance()` checks a `Symbol.for(...)`
 * marker rather than `instanceof`, so it still recognises errors thrown by the separate nested
 * copies of `@ai-sdk/provider` that `@ai-sdk/google`/`@ai-sdk/openai` bundle (confirmed empirically:
 * cross-version `isInstance` returns true even though the class objects differ) — so this check is
 * reliable, not aspirational.
 */
export function toAiError(error: unknown, provider: ProviderId): AiError | undefined {
  if (isMissingProviderKeyError(error)) {
    return new AiError('NO_KEY', provider, error.message, error);
  }

  if (APICallError.isInstance(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return new AiError(
        'INVALID_KEY',
        provider,
        `The ${provider} API key was rejected. Update it in Settings.`,
        error
      );
    }
    if (error.statusCode === 429 || RATE_LIMIT_MESSAGE_PATTERN.test(error.message)) {
      return new AiError(
        'RATE_LIMITED',
        provider,
        `The ${provider} account has hit its quota or rate limit. Try again later.`,
        error
      );
    }
    // Any other APICallError still came from the provider SDK, and its `message` embeds the
    // upstream response body — which must never reach the caller (routes would otherwise echo it
    // from their generic fallthrough). Classify it with a generic message and keep the original
    // attached as the cause; callers already `console.error` it server-side.
    return new AiError(
      'UPSTREAM_ERROR',
      provider,
      `The ${provider} request failed. Try again later.`,
      error
    );
  }

  return undefined;
}

/** Serialises an `AiError` into the shape `hooks/appFetch.ts:20-27` parses off a non-ok response —
 * a JSON body with `error` (message) and `code` — plus `provider` for callers that want it, at the
 * status `aiErrorCodeToStatus` maps the code to. Framework-agnostic like
 * `libs/ai/promptArticles/errors.ts`, so routes wrap it with their own `NextResponse.json(...)`. */
export function aiErrorToResponseInit(error: AiError): {
  body: { error: string; code: AiErrorCode; provider: ProviderId };
  status: number;
} {
  return {
    body: { error: error.message, code: error.code, provider: error.provider },
    status: aiErrorCodeToStatus(error.code),
  };
}
