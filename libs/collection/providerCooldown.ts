import type { ProviderId } from '@/libs/database/shared/ProviderId';
import { PROVIDER_COOLDOWN_MS } from './constants';

/** Cooldown-until epoch ms per provider. Module-level so every caller across a Collection Run
 *  shares the same cooldown state. */
const cooldownUntilByProvider = new Map<ProviderId, number>();

export function startProviderCooldown(
  provider: ProviderId,
  durationMs = PROVIDER_COOLDOWN_MS
): void {
  cooldownUntilByProvider.set(provider, Date.now() + durationMs);
}

export function getRemainingCooldownMs(provider: ProviderId): number {
  const cooldownUntil = cooldownUntilByProvider.get(provider);
  if (!cooldownUntil) return 0;
  return Math.max(0, cooldownUntil - Date.now());
}

/** Resolves immediately unless the provider is cooling down after a 429, in which case every
 *  other queued call for that provider waits rather than hammering it. */
export async function waitForProviderCooldown(provider: ProviderId): Promise<void> {
  const remainingMs = getRemainingCooldownMs(provider);
  if (!remainingMs) return;
  await new Promise<void>((resolve) => setTimeout(resolve, remainingMs));
}

export function clearProviderCooldowns(): void {
  cooldownUntilByProvider.clear();
}
