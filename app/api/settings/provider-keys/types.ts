import { z } from 'zod';
import type { ProviderId } from '@/libs/database/shared/ProviderId';
import type { RedactedProviderKey } from '@/libs/database/Settings/types';

// Kept as a literal tuple rather than `Object.keys` on some registry — there is no runtime
// `ProviderId` value anywhere else in the codebase to derive it from (see
// libs/database/shared/ProviderId.ts).
const PROVIDER_IDS = ['google', 'openai', 'perplexity'] as const satisfies readonly ProviderId[];

export const ProviderIdSchema = z.enum(PROVIDER_IDS);

export const SetProviderKeyBodySchema = z.object({
  provider: ProviderIdSchema,
  key: z.string().min(1),
});

export const RemoveProviderKeyBodySchema = z.object({
  provider: ProviderIdSchema,
});

/** `message` is `ProviderKeyValidation.message` — safe to show to the user, never the key value. */
export type SetProviderKeyResponse = {
  providerKeys: RedactedProviderKey[];
  message: string;
};

export type RemoveProviderKeyResponse = {
  providerKeys: RedactedProviderKey[];
};
