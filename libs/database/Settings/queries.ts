import 'server-only';

import { asc, eq } from 'drizzle-orm';

import { getDatabase } from '../client';
import { settings } from '../schema';
import type { ChatbotId } from '../shared/ChatbotId';
import type { ProviderId } from '../shared/ProviderId';
import type { ProviderKeyStatus, RedactedProviderKey, StoredProviderKey } from './types';

/** Returns the singleton settings row, inserting one with column defaults on first call.
 * Unlike `getOrganization()`, callers never have to handle "no settings yet" — this app is
 * single-user and single-process, so there is no concurrent-insert race to guard against. */
async function getOrCreateSettingsRow() {
  const db = await getDatabase();
  const [existing] = await db.select().from(settings).orderBy(asc(settings.created_at)).limit(1);
  if (existing) return existing;

  const [created] = await db.insert(settings).values({}).returning();
  if (!created) throw new Error('Insert into settings returned no row');
  return created;
}

/** The raw key. Server-only — never return this to a client; use `getRedactedProviderKeys()`. */
export async function getProviderKeyFromStorage(provider: ProviderId): Promise<string | undefined> {
  const row = await getOrCreateSettingsRow();
  return row.provider_keys[provider]?.key;
}

export async function getRedactedProviderKeys(): Promise<RedactedProviderKey[]> {
  const row = await getOrCreateSettingsRow();
  return (Object.entries(row.provider_keys) as [ProviderId, StoredProviderKey][]).map(
    ([provider, stored]) => ({
      provider,
      lastFour: stored.key.slice(-4),
      status: stored.status,
      validatedAt: stored.validatedAt,
    })
  );
}

export async function setProviderKey(
  provider: ProviderId,
  key: string,
  status: ProviderKeyStatus
): Promise<void> {
  const db = await getDatabase();
  const row = await getOrCreateSettingsRow();
  const provider_keys: Partial<Record<ProviderId, StoredProviderKey>> = {
    ...row.provider_keys,
    [provider]: { key, status, validatedAt: new Date().toISOString() },
  };
  await db.update(settings).set({ provider_keys }).where(eq(settings.id, row.id));
}

export async function removeProviderKey(provider: ProviderId): Promise<void> {
  const db = await getDatabase();
  const row = await getOrCreateSettingsRow();
  const provider_keys = { ...row.provider_keys };
  delete provider_keys[provider];
  await db.update(settings).set({ provider_keys }).where(eq(settings.id, row.id));
}

/** The stored selection only — not intersected with which providers currently have a key. */
export async function getEnabledChatbotIds(): Promise<ChatbotId[]> {
  const row = await getOrCreateSettingsRow();
  return row.enabled_chatbots;
}

export async function setEnabledChatbotIds(ids: ChatbotId[]): Promise<void> {
  const db = await getDatabase();
  const row = await getOrCreateSettingsRow();
  await db.update(settings).set({ enabled_chatbots: ids }).where(eq(settings.id, row.id));
}
