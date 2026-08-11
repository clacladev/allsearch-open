import { APICallError } from '@ai-sdk/provider';
import { toAiError } from '@/libs/ai/errors';
import { isUngroundedResponseError } from '@/libs/ai/grounding';
import type { ProviderId } from '@/libs/database/shared/ProviderId';
import { aiCallLimiter } from './concurrencyLimiter';
import { MAX_ITEM_ATTEMPTS, RATE_LIMIT_BACKOFF_BASE_MS } from './constants';
import { getRemainingCooldownMs, startProviderCooldown } from './providerCooldown';

export type AiCallOutcome<T> =
  | { isCompleted: true; value: T; attempts: number }
  | { isCompleted: false; error: Error; attempts: number };

const realSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// `executePrompt.ts`'s two `callAiWithRetry` call sites never pass `options.sleep` — their own
// signatures are the plan's pinned public API and have no seam for it — so a suite that drives a
// real 429 through the full executePrompt/runLoop path (rather than calling `callAiWithRetry`
// directly, as this file's own tests do) has no way to keep this real timer from actually
// elapsing. Since the retry loop re-checks the provider cooldown at the top of every attempt (see
// below), a single rate-limited item can genuinely wait out most of `PROVIDER_COOLDOWN_MS` twice
// over on top of its own backoff. This override is that seam: test-only, unused by any production
// caller, and reset back to a real timer by `resetDefaultCallAiSleepForTesting()`.
let defaultSleep: (ms: number) => Promise<void> = realSleep;

export function setDefaultCallAiSleepForTesting(sleep: (ms: number) => Promise<void>): void {
  defaultSleep = sleep;
}

export function resetDefaultCallAiSleepForTesting(): void {
  defaultSleep = realSleep;
}

/** Reads the provider's `Retry-After` response header off a rate-limited `APICallError`, in ms,
 *  when present — preferred over the fixed `PROVIDER_COOLDOWN_MS` fallback since it reflects what
 *  the provider itself asked for. Only the delta-seconds form (e.g. "30") is handled; an HTTP-date
 *  value falls back to `PROVIDER_COOLDOWN_MS` via `startProviderCooldown`'s default. */
function getRetryAfterMs(error: unknown): number | undefined {
  if (!APICallError.isInstance(error)) return;
  const retryAfterHeader = error.responseHeaders?.['retry-after'];
  if (!retryAfterHeader) return;
  const retryAfterSeconds = Number(retryAfterHeader);
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds < 0) return;
  return retryAfterSeconds * 1000;
}

/** Every LLM call in a Collection Run goes through here: provider cooldown, then the global
 *  limiter, then classification via `toAiError()`. `RATE_LIMITED` retries with exponential
 *  backoff up to `maxAttempts` and opens a cooldown for that provider; an ungrounded Google
 *  response (issue 25) retries immediately, also up to `maxAttempts`; anything else fails on the
 *  first attempt with no retry. Returns an outcome rather than throwing so the caller can record
 *  an honest `attempts` and `error` on the item row. */
export async function callAiWithRetry<T>(
  provider: ProviderId,
  call: () => Promise<T>,
  options?: { maxAttempts?: number; sleep?: (ms: number) => Promise<void> }
): Promise<AiCallOutcome<T>> {
  const maxAttempts = options?.maxAttempts ?? MAX_ITEM_ATTEMPTS;
  const sleep = options?.sleep ?? defaultSleep;
  let attempt = 0;

  while (true) {
    attempt += 1;
    // Waits out any active per-provider cooldown before acquiring a limiter slot, so a
    // cooling-down provider does not occupy capacity another provider could use. Deliberately
    // uses `getRemainingCooldownMs` + the injectable `sleep` here rather than calling
    // `waitForProviderCooldown` directly (which always uses a real timer): `startProviderCooldown`
    // runs on every retryable attempt below, so a literal `waitForProviderCooldown` call at the
    // top of this loop would otherwise force a retry to sit out its own just-opened real-time
    // cooldown even when a test injects a no-op `sleep`. Production behaviour is unchanged since
    // the default `sleep` is a real `setTimeout`.
    const remainingCooldownMs = getRemainingCooldownMs(provider);
    if (remainingCooldownMs) await sleep(remainingCooldownMs);
    try {
      const value = await aiCallLimiter.run(call);
      return { isCompleted: true, value, attempts: attempt };
    } catch (rawError) {
      // toAiError returns undefined for an error it doesn't recognise as AI-credential/rate-limit
      // shaped — that means "not a classified AI error", so it is not retried.
      const aiError = toAiError(rawError, provider);
      const isRateLimited = aiError?.code === 'RATE_LIMITED';
      if (isRateLimited && attempt < maxAttempts) {
        startProviderCooldown(provider, getRetryAfterMs(rawError));
        await sleep(RATE_LIMIT_BACKOFF_BASE_MS * 2 ** (attempt - 1));
        continue;
      }
      // An ungrounded response is a per-call coin flip by the model, not a sign the provider is
      // unhealthy: no cooldown (that would stall every other Google item behind a provider that is
      // answering fine) and no backoff (waiting changes nothing about the next roll). `maxAttempts`
      // is the cap the issue asks for — retries are billed to the user's own key, so exhausting it
      // leaves the item `failed` and retryable rather than looping.
      if (isUngroundedResponseError(rawError) && attempt < maxAttempts) continue;
      const error = aiError ?? (rawError instanceof Error ? rawError : new Error(String(rawError)));
      return { isCompleted: false, error, attempts: attempt };
    }
  }
}
