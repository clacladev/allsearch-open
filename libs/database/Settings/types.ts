import type { ProviderId } from '../shared/ProviderId';

export type ProviderKeyStatus = 'valid' | 'unverified' | 'rate_limited';

export type StoredProviderKey = {
  key: string;
  status: ProviderKeyStatus;
  validatedAt: string;
};

/** The only shape a provider key may take once it crosses to a client: the raw key never leaves
 * the server, only enough to confirm which key is set and whether it still works. */
export type RedactedProviderKey = {
  provider: ProviderId;
  lastFour: string;
  status: ProviderKeyStatus;
  validatedAt: string;
};
