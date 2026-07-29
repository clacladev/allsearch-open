import 'server-only';

import { asc, eq } from 'drizzle-orm';

import { getDatabase } from '../client';
import { settings } from '../schema';
import { CHATBOT_PROVIDER, SUPPORTED_CHATBOTS_IDS, type ChatbotId } from '../shared/ChatbotId';
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

/** The stored selection only, exactly as the user last saved it — `null` if they never have (a
 * fresh install), `[]` if they deliberately turned every Chatbot off. Not intersected with which
 * providers currently have a key; for that, use `getEffectiveEnabledChatbotIds()`. Only the
 * settings UI, which renders raw toggle state, should call this. */
export async function getStoredEnabledChatbotIds(): Promise<ChatbotId[] | null> {
  const row = await getOrCreateSettingsRow();
  return row.enabled_chatbots;
}

export async function setStoredEnabledChatbotIds(ids: ChatbotId[]): Promise<void> {
  const db = await getDatabase();
  const row = await getOrCreateSettingsRow();
  await db.update(settings).set({ enabled_chatbots: ids }).where(eq(settings.id, row.id));
}

/** The set of Chatbots a Collection Run (or any other AI-dependent feature) should actually use:
 * the stored selection intersected with providers that currently have a key, so a removed key
 * silently drops its Chatbot without touching the stored selection — re-adding the key restores
 * it. A never-touched selection (`null`, every fresh install) defaults to every Chatbot with a
 * key present, per issue 09; a deliberate all-off selection (`[]`) stays off. A Chatbot with no
 * key is never included, regardless of the stored selection. */
export async function getEffectiveEnabledChatbotIds(): Promise<ChatbotId[]> {
  const row = await getOrCreateSettingsRow();
  const hasKey = (chatbotId: ChatbotId) =>
    row.provider_keys[CHATBOT_PROVIDER[chatbotId]] !== undefined;
  const stored = row.enabled_chatbots;
  if (stored === null) return SUPPORTED_CHATBOTS_IDS.filter(hasKey);
  return SUPPORTED_CHATBOTS_IDS.filter(
    (chatbotId) => stored.includes(chatbotId) && hasKey(chatbotId)
  );
}
