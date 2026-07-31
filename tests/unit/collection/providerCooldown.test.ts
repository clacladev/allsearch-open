import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  startProviderCooldown,
  getRemainingCooldownMs,
  waitForProviderCooldown,
  clearProviderCooldowns,
} from '@/libs/collection/providerCooldown';

describe('providerCooldown', () => {
  beforeEach(() => {
    clearProviderCooldowns();
  });

  // The last case below opens a real 30s cooldown and is followed by no later `beforeEach` in
  // this file to clear it. `providerCooldown`'s state is a module-level singleton shared by every
  // caller of `callAiWithRetry` for the rest of the test process, so without this an unrelated
  // later suite's real (uninjected) `sleep` would genuinely wait it out.
  afterEach(() => {
    clearProviderCooldowns();
  });

  it('resolves immediately for a provider with no active cooldown', async () => {
    const start = Date.now();
    await waitForProviderCooldown('openai');
    expect(Date.now() - start).toBeLessThan(15);
  });

  it('makes a cooling-down provider wait, while an unrelated provider is unaffected', async () => {
    startProviderCooldown('openai', 30);

    const openaiStart = Date.now();
    await waitForProviderCooldown('openai');
    expect(Date.now() - openaiStart).toBeGreaterThanOrEqual(25);

    const googleStart = Date.now();
    await waitForProviderCooldown('google');
    expect(Date.now() - googleStart).toBeLessThan(15);
  });

  it('decays getRemainingCooldownMs down to 0 once the cooldown expires', async () => {
    startProviderCooldown('perplexity', 30);
    expect(getRemainingCooldownMs('perplexity')).toBeGreaterThan(0);

    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(getRemainingCooldownMs('perplexity')).toBe(0);
  });

  it('clearProviderCooldowns resets every provider', async () => {
    startProviderCooldown('openai', 10_000);
    clearProviderCooldowns();

    expect(getRemainingCooldownMs('openai')).toBe(0);
    const start = Date.now();
    await waitForProviderCooldown('openai');
    expect(Date.now() - start).toBeLessThan(15);
  });

  it('defaults to PROVIDER_COOLDOWN_MS when no duration is given', () => {
    startProviderCooldown('openai');
    const remainingMs = getRemainingCooldownMs('openai');
    expect(remainingMs).toBeGreaterThan(29_000);
    expect(remainingMs).toBeLessThanOrEqual(30_000);
  });
});
