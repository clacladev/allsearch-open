import 'server-only';

import { eq, sql } from 'drizzle-orm';

import { getDatabase } from '../client';
import { settings } from '../schema';
import { CHATBOT_PROVIDER, SUPPORTED_CHATBOTS_IDS, type ChatbotId } from '../shared/ChatbotId';
import type { ProviderId } from '../shared/ProviderId';
import type { ProviderKeyStatus, RedactedProviderKey, StoredProviderKey } from './types';

/** Fixed id for the one-and-only settings row — a literal constant rather than `idColumn()`'s
 * usual random UUID, so `getOrCreateSettingsRow()` can resolve "does the row exist yet" with a
 * single atomic `INSERT ... ON CONFLICT DO NOTHING` instead of a separate read followed by a
 * decide-whether-to-insert, which two concurrent callers (e.g. the Settings page's `Promise.all`
 * of two queries on a fresh install) can both observe as "no row yet" and both insert. Every write
 * below targets this id directly rather than whatever id a prior read happened to return. */
const SETTINGS_SINGLETON_ID = 'singleton';

/** Runs a settings-table write and guarantees no failure that escapes this module carries bound
 * query parameters. drizzle-orm@1.0.0-rc.4's `DrizzleQueryError.message` is exactly
 * `"Failed query: <sql>\nparams: <params>"` — several of the writes below bind the plaintext
 * provider key JSON, so a disk-full or `SQLITE_BUSY` failure would otherwise put the raw key
 * straight into a thrown error's `.message` for a caller to log or display. Every write in this
 * file goes through this wrapper — not just the ones that currently bind a key — so that stays
 * true regardless of what this file grows into later. */
async function runSettingsWrite(operation: string, write: () => unknown): Promise<void> {
  try {
    await write();
  } catch (err) {
    console.error(
      `Settings write failed (${operation}):`,
      err instanceof Error ? err.name : typeof err
    );
    throw new Error(`Could not update settings (${operation}).`);
  }
}

/** Returns the singleton settings row, inserting one on first call. The Next.js server handles
 * concurrent requests, so this can't assume it's the only caller in flight — see
 * `runSettingsWrite` and `SETTINGS_SINGLETON_ID` above for how the insert and every subsequent
 * write avoid racing each other. */
async function getOrCreateSettingsRow() {
  const db = await getDatabase();
  await runSettingsWrite('ensure settings row', () =>
    db.insert(settings).values({ id: SETTINGS_SINGLETON_ID }).onConflictDoNothing()
  );
  const [row] = await db.select().from(settings).where(eq(settings.id, SETTINGS_SINGLETON_ID));
  if (!row) throw new Error('Insert into settings returned no row');
  return row;
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
  await getOrCreateSettingsRow();
  const stored: StoredProviderKey = { key, status, validatedAt: new Date().toISOString() };
  // A single `json_set` statement mutates the stored JSON in place rather than this process
  // reading the full `provider_keys` object, editing it in memory, and writing the whole thing
  // back — that read-modify-write isn't transactional, so two saves close together (every save
  // makes a live validation call first, taking up to 5s, so overlap is routine, not exotic) can
  // each read the same pre-update JSON and the second write silently discards the first one's key.
  await runSettingsWrite('setProviderKey', () =>
    db.run(sql`
      UPDATE settings
      SET provider_keys = json_set(provider_keys, '$.' || ${provider}, json(${JSON.stringify(stored)}))
      WHERE id = ${SETTINGS_SINGLETON_ID}
    `)
  );
}

export async function removeProviderKey(provider: ProviderId): Promise<void> {
  const db = await getDatabase();
  await getOrCreateSettingsRow();
  // See `setProviderKey` above — `json_remove` is the same in-place mutation, for the same reason.
  await runSettingsWrite('removeProviderKey', () =>
    db.run(sql`
      UPDATE settings
      SET provider_keys = json_remove(provider_keys, '$.' || ${provider})
      WHERE id = ${SETTINGS_SINGLETON_ID}
    `)
  );
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
  await getOrCreateSettingsRow();
  await runSettingsWrite('setStoredEnabledChatbotIds', () =>
    db.update(settings).set({ enabled_chatbots: ids }).where(eq(settings.id, SETTINGS_SINGLETON_ID))
  );
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
