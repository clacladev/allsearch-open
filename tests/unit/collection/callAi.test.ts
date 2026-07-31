import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { APICallError } from '@ai-sdk/provider';
import { callAiWithRetry } from '@/libs/collection/callAi';
import { aiCallLimiter } from '@/libs/collection/concurrencyLimiter';
import { clearProviderCooldowns, getRemainingCooldownMs } from '@/libs/collection/providerCooldown';

// Real APICallError from @ai-sdk/provider, not a hand-rolled look-alike, so toAiError's
// `isInstance` marker check (libs/ai/errors.ts:60-74) is genuinely exercised.
function rateLimitedError(message = 'Too many requests') {
  return new APICallError({
    message,
    url: 'https://example.test',
    requestBodyValues: {},
    statusCode: 429,
  });
}

const noopSleep = async () => {};

describe('callAiWithRetry', () => {
  beforeEach(() => {
    clearProviderCooldowns();
    aiCallLimiter.resetCounters();
  });

  // Several cases above open a real provider cooldown (e.g. the last one, "runs entirely in
  // milliseconds..."). `providerCooldown`'s state is a module-level singleton shared by every
  // caller of `callAiWithRetry` for the rest of the test process — without this, a cooldown left
  // open past this file's last test makes an unrelated later suite's real (uninjected) `sleep`
  // genuinely wait it out, e.g. `tests/unit/collection/executePrompt.test.ts`.
  afterEach(() => {
    clearProviderCooldowns();
  });

  it('retries a persistent 429 up to maxAttempts, fails, and opens a provider cooldown', async () => {
    let callCount = 0;
    const outcome = await callAiWithRetry(
      'openai',
      async () => {
        callCount += 1;
        throw rateLimitedError();
      },
      { sleep: noopSleep }
    );

    expect(outcome.isCompleted).toBe(false);
    if (outcome.isCompleted) throw new Error('unreachable');
    expect(outcome.attempts).toBe(3);
    expect(callCount).toBe(3);
    expect(outcome.error.message).toContain('quota or rate limit');
    expect(getRemainingCooldownMs('openai')).toBeGreaterThan(0);
  });

  it('fails on the first attempt for a non-rate-limit error, with no retry and no cooldown', async () => {
    let callCount = 0;
    const outcome = await callAiWithRetry(
      'google',
      async () => {
        callCount += 1;
        throw new Error('totally unrelated failure');
      },
      { sleep: noopSleep }
    );

    expect(outcome.isCompleted).toBe(false);
    if (outcome.isCompleted) throw new Error('unreachable');
    expect(outcome.attempts).toBe(1);
    expect(callCount).toBe(1);
    expect(outcome.error.message).toBe('totally unrelated failure');
    expect(getRemainingCooldownMs('google')).toBe(0);
  });

  it('succeeds after a single 429 retry', async () => {
    let callCount = 0;
    const outcome = await callAiWithRetry(
      'perplexity',
      async () => {
        callCount += 1;
        if (callCount === 1) throw rateLimitedError();
        return 'the response';
      },
      { sleep: noopSleep }
    );

    expect(outcome.isCompleted).toBe(true);
    if (!outcome.isCompleted) throw new Error('unreachable');
    expect(outcome.value).toBe('the response');
    expect(outcome.attempts).toBe(2);
    expect(callCount).toBe(2);
  });

  it('returns undefined-classified errors as-is, unretried, when toAiError does not recognise them', async () => {
    const outcome = await callAiWithRetry(
      'openai',
      async () => {
        throw 'a string was thrown';
      },
      { sleep: noopSleep }
    );

    expect(outcome.isCompleted).toBe(false);
    if (outcome.isCompleted) throw new Error('unreachable');
    expect(outcome.attempts).toBe(1);
    expect(outcome.error).toBeInstanceOf(Error);
  });

  it('honours a custom maxAttempts', async () => {
    let callCount = 0;
    const outcome = await callAiWithRetry(
      'openai',
      async () => {
        callCount += 1;
        throw rateLimitedError();
      },
      { sleep: noopSleep, maxAttempts: 1 }
    );

    expect(outcome.attempts).toBe(1);
    expect(callCount).toBe(1);
  });

  it('prefers a Retry-After response header over the fixed PROVIDER_COOLDOWN_MS fallback', async () => {
    let callCount = 0;
    await callAiWithRetry(
      'openai',
      async () => {
        callCount += 1;
        throw new APICallError({
          message: 'Too many requests',
          url: 'https://example.test',
          requestBodyValues: {},
          statusCode: 429,
          responseHeaders: { 'retry-after': '1' },
        });
      },
      { sleep: noopSleep }
    );

    expect(callCount).toBe(3);
    // 1s Retry-After, well under the 30s PROVIDER_COOLDOWN_MS fallback.
    expect(getRemainingCooldownMs('openai')).toBeLessThan(1_500);
  });

  it('runs entirely in milliseconds when sleep is injected as a no-op', async () => {
    const start = Date.now();
    await callAiWithRetry(
      'openai',
      async () => {
        throw rateLimitedError();
      },
      { sleep: noopSleep }
    );
    expect(Date.now() - start).toBeLessThan(200);
  });
});
