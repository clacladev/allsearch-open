import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, it } from 'bun:test';
import { sql } from 'drizzle-orm';

import { createDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { projects } from '@/libs/database/schema';
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

  it('upgrades a database already at migration N to N+1, backing up the pre-migration state', async () => {
    dbPath = createTempDbPath('migrate-upgrade');

    // Fresh install against the app's real (single) migration, then insert a row that must
    // survive into the backup but not into the post-upgrade live database's new column.
    db = await createDatabase(dbPath);
    await migrateDatabase(db, dbPath);
    const [project] = await db
      .insert(projects)
      .values({ url: 'https://example.com', name: 'Example', aliases: [] })
      .returning();
    closeDatabase(db);

    // Build a migrations folder holding a copy of every real migration plus a second migration
    // this test invents, so the upgrade path can be exercised without touching the app's real
    // `drizzle/` folder. Sorted so this keeps working once there's more than one real migration —
    // directory order isn't guaranteed, and `[0]` alone would silently copy just one of them.
    const realMigrationsFolder = join(process.cwd(), 'drizzle');
    const realMigrationNames = readdirSync(realMigrationsFolder).sort();
    const upgradeMigrationsFolder = mkdtempSync(join(tmpdir(), 'allsearch-migrate-upgrade-'));
    for (const migrationName of realMigrationNames) {
      cpSync(
        join(realMigrationsFolder, migrationName),
        join(upgradeMigrationsFolder, migrationName),
        { recursive: true }
      );
    }
    const secondMigrationName = '20991231235959_add_test_col';
    mkdirSync(join(upgradeMigrationsFolder, secondMigrationName));
    writeFileSync(
      join(upgradeMigrationsFolder, secondMigrationName, 'migration.sql'),
      'ALTER TABLE `projects` ADD `test_col` text;'
    );

    try {
      db = await createDatabase(dbPath);
      await migrateDatabase(db, dbPath, upgradeMigrationsFolder);

      const backupFiles = backupFilesNextTo(dbPath);
      expect(backupFiles.length).toBe(1);

      const backupDb = new Database(join(dirname(dbPath), backupFiles[0]));
      const backupColumns = backupDb.query('PRAGMA table_info(projects)').all() as {
        name: string;
      }[];
      expect(backupColumns.some((column) => column.name === 'test_col')).toBe(false);
      const backupProject = backupDb
        .query('SELECT id, name FROM projects WHERE id = ?')
        .get(project.id) as { id: string; name: string };
      backupDb.close();
      expect(backupProject).toEqual({ id: project.id, name: 'Example' });

      const liveColumns = await db.all<{ name: string }>(sql`PRAGMA table_info(projects)`);
      expect(liveColumns.some((column) => column.name === 'test_col')).toBe(true);

      const appliedMigrations = await db.all<{ name: string }>(
        sql`SELECT name FROM __drizzle_migrations`
      );
      expect(appliedMigrations.map((migration) => migration.name).sort()).toEqual(
        [...realMigrationNames, secondMigrationName].sort()
      );
    } finally {
      rmSync(upgradeMigrationsFolder, { recursive: true, force: true });
    }
  });
});
