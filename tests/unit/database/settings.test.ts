import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';

import { getDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { settings } from '@/libs/database/schema';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import type * as SettingsQueriesModule from '@/libs/database/Settings/queries';
import { cleanupTempDbPath, closeDatabase, createTempDbPath } from './testHelpers';

// Settings/queries.ts calls the app-wide memoised getDatabase() (see libs/database/client.ts)
// rather than accepting a db instance, and that memoisation is process-global and permanent for
// the life of the process — unlike the other tests/unit/database/*.test.ts files, this suite
// can't get a fresh connection per test. So this file sets ALLSEARCH_DB_PATH and calls the real
// getDatabase() exactly once, in beforeAll, and shares one migrated database across every test
// below, resetting its one row between tests instead of recreating the database.
//
// tests/unit/ai/models.test.ts mocks '@/libs/database/Settings/queries' at file scope, and that
// mock leaks process-wide via Bun's mock.module() (see that file's own comment on the same
// mechanism for '@/libs/ai/models'). A fresh, cache-busted import dodges it, regardless of
// whether that other file happens to run before or after this one.
let queries: typeof SettingsQueriesModule;

let dbPath: string;
let db: AllSearchDatabase;

beforeAll(async () => {
  dbPath = createTempDbPath('settings');
  process.env.ALLSEARCH_DB_PATH = dbPath;
  db = await getDatabase();
  await migrateDatabase(db, dbPath);

  // @ts-expect-error -- the query string is a deliberate cache-busting specifier (see comment
  // above); it has no matching module declaration.
  queries = await import('@/libs/database/Settings/queries?fresh-for-settings-test');
});

afterAll(() => {
  delete process.env.ALLSEARCH_DB_PATH;
  closeDatabase(db);
  cleanupTempDbPath(dbPath);
});

beforeEach(async () => {
  await db.delete(settings);
});

describe('Settings queries', () => {
  it('creates the singleton row on first read and reuses it afterwards', async () => {
    expect(await queries.getEnabledChatbotIds()).toEqual([]);
    expect(await db.select().from(settings)).toHaveLength(1);

    // A second read must not insert a second row.
    await queries.getEnabledChatbotIds();
    expect(await db.select().from(settings)).toHaveLength(1);
  });

  it('stores and retrieves a provider key, redacted to only its last four characters', async () => {
    await queries.setProviderKey('openai', 'sk-test-abcdef1234', 'valid');

    expect(await queries.getProviderKeyFromStorage('openai')).toBe('sk-test-abcdef1234');

    const redacted = await queries.getRedactedProviderKeys();
    expect(redacted).toEqual([
      { provider: 'openai', lastFour: '1234', status: 'valid', validatedAt: expect.any(String) },
    ]);
    expect(JSON.stringify(redacted)).not.toContain('sk-test-abcdef1234');
  });

  it('removes a provider key', async () => {
    await queries.setProviderKey('google', 'google-secret-key', 'valid');

    await queries.removeProviderKey('google');

    expect(await queries.getProviderKeyFromStorage('google')).toBeUndefined();
    expect(await queries.getRedactedProviderKeys()).toEqual([]);
  });

  it('keeps each provider key independent of the others', async () => {
    await queries.setProviderKey('openai', 'openai-key-1234', 'valid');
    await queries.setProviderKey('google', 'google-key-5678', 'unverified');

    await queries.removeProviderKey('openai');

    expect(await queries.getProviderKeyFromStorage('openai')).toBeUndefined();
    expect(await queries.getProviderKeyFromStorage('google')).toBe('google-key-5678');
  });

  it('round-trips the enabled chatbot id selection', async () => {
    await queries.setEnabledChatbotIds([ChatbotId.ChatGPT, ChatbotId.Perplexity]);

    expect(await queries.getEnabledChatbotIds()).toEqual([ChatbotId.ChatGPT, ChatbotId.Perplexity]);
  });
});
