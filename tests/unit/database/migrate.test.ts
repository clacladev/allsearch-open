import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, it } from 'bun:test';
import { sql } from 'drizzle-orm';

import { createDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { cleanupTempDbPath, closeDatabase, createTempDbPath } from './testHelpers';

const EXPECTED_TABLE_NAMES = [
  'collection_run_items',
  'collection_runs',
  'competitors',
  'organizations',
  'projects',
  'prompt_articles',
  'prompt_responses',
  'prompts',
  'sources',
  'topics',
].sort();

function backupFilesNextTo(dbPath: string): string[] {
  return readdirSync(dirname(dbPath)).filter((name) => name.includes('.backup'));
}

describe('migrateDatabase', () => {
  let dbPath: string | undefined;
  let db: AllSearchDatabase | undefined;

  afterEach(() => {
    delete process.env.ALLSEARCH_DB_PATH;
    if (db) closeDatabase(db);
    if (dbPath) cleanupTempDbPath(dbPath);
    db = undefined;
    dbPath = undefined;
  });

  it('migrating a fresh path creates the file and all 10 tables', async () => {
    dbPath = createTempDbPath('migrate-fresh');
    db = await createDatabase(dbPath);
    await migrateDatabase(db, dbPath);

    expect(existsSync(dbPath)).toBe(true);

    const tables = await db.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'`
    );
    expect(tables.map((t) => t.name).sort()).toEqual(EXPECTED_TABLE_NAMES);
    expect(backupFilesNextTo(dbPath)).toEqual([]);
  });

  it('running the migration twice is a no-op the second time and produces no backup', async () => {
    dbPath = createTempDbPath('migrate-noop');
    db = await createDatabase(dbPath);
    await migrateDatabase(db, dbPath);

    await migrateDatabase(db, dbPath);

    expect(backupFilesNextTo(dbPath)).toEqual([]);
  });

  it('backs up a pre-existing database before migrating, preserving the pre-migration data', async () => {
    dbPath = createTempDbPath('migrate-existing');

    // Simulate a database left behind by a previous app session, at an older journal state
    // (here, one that predates drizzle's own migration bookkeeping entirely).
    const seedDb = new Database(dbPath);
    seedDb.run('CREATE TABLE legacy_marker (id INTEGER PRIMARY KEY, note TEXT)');
    seedDb.run("INSERT INTO legacy_marker (note) VALUES ('pre-migration data')");
    seedDb.close();

    db = await createDatabase(dbPath);
    await migrateDatabase(db, dbPath);

    const backupFiles = backupFilesNextTo(dbPath);
    expect(backupFiles.length).toBe(1);

    const backupDb = new Database(join(dirname(dbPath), backupFiles[0]));
    const rows = backupDb.query('SELECT note FROM legacy_marker').all();
    backupDb.close();
    expect(rows).toEqual([{ note: 'pre-migration data' }]);
  });
});
