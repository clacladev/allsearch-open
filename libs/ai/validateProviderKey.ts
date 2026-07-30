import type { ProviderId } from '@/libs/database/shared/ProviderId';
import type { ProviderKeyStatus } from '@/libs/database/Settings/types';

const VALIDATION_TIMEOUT_MS = 5_000;

const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: 'OpenAI',
  google: 'Google',
  perplexity: 'Perplexity',
};

export type ProviderKeyValidation = {
  /** Meaningful only when `isRejected` is false — `ProviderKeyStatus` has no "rejected" member,
   * since a rejected key is never persisted at all (see `setProviderKey`). */
  status: ProviderKeyStatus;
  /** True only for a definitive 401/403 — the caller must not save the key. */
  isRejected: boolean;
  /** Safe to show to the user; never contains the key value. */
  message: string;
};

function unverified(message: string): ProviderKeyValidation {
  return { status: 'unverified', isRejected: false, message };
}

function valid(): ProviderKeyValidation {
  return { status: 'valid', isRejected: false, message: 'Key verified.' };
}

function rateLimited(provider: ProviderId): ProviderKeyValidation {
  return {
    status: 'rate_limited',
    isRejected: false,
    message: `${PROVIDER_LABELS[provider]} reports this key is rate limited right now, but it is a working key.`,
  };
}

function rejected(provider: ProviderId): ProviderKeyValidation {
  return {
    status: 'unverified',
    isRejected: true,
    message: `${PROVIDER_LABELS[provider]} rejected this key.`,
  };
}

/** Maps a live status code from a provider's own API to a validation outcome. Never include the
 * key or any part of the request/response in the message — only the provider name. */
function fromStatus(provider: ProviderId, status: number): ProviderKeyValidation {
  if (status === 401 || status === 403) return rejected(provider);
  if (status === 429) return rateLimited(provider);
  if (status >= 200 && status < 300) return valid();
  return unverified(
    `Could not verify this key with ${PROVIDER_LABELS[provider]} right now. It has been saved and will be checked again on first use.`
  );
}

async function validateGoogleKey(key: string): Promise<ProviderKeyValidation> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(VALIDATION_TIMEOUT_MS) }
    );
    return fromStatus('google', response.status);
  } catch {
    // Network error, timeout, DNS failure, etc. — not a statement about the key itself.
    return unverified(
      'Could not reach Google right now. The key has been saved and will be checked again on first use.'
    );
  }
}

async function validateOpenaiKey(key: string): Promise<ProviderKeyValidation> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(VALIDATION_TIMEOUT_MS),
    });
    return fromStatus('openai', response.status);
  } catch {
    return unverified(
      'Could not reach OpenAI right now. The key has been saved and will be checked again on first use.'
    );
  }
}

/**
 * Perplexity has no free list-models (or similarly cheap) endpoint — every call costs real money
 * on the user's account. Spending it at key-entry time, before the key has done anything useful,
 * is not a validation call worth making. So the key is saved `unverified` and gets its first real
 * check the first time it's actually used to run a Chatbot. This was an explicit product decision
 * (see issue 08), not an oversight.
 */
function validatePerplexityKey(): ProviderKeyValidation {
  return unverified(
    'Perplexity keys cannot be verified without spending money, so this key will be checked on first use.'
  );
}

/** Verifies a provider key with a single cheap, free live call (or no call at all for Perplexity)
 * before it is persisted. Never throws — every branch above resolves to a `ProviderKeyValidation`,
 * and no branch's message or status can leak the key value. */
export async function validateProviderKey(
  provider: ProviderId,
  key: string
): Promise<ProviderKeyValidation> {
  switch (provider) {
    case 'google':
      return validateGoogleKey(key);
    case 'openai':
      return validateOpenaiKey(key);
    case 'perplexity':
      return validatePerplexityKey();
  }
}
