import { sql, type EmptyRelations } from 'drizzle-orm';
import type { SQLiteAsyncDatabase } from 'drizzle-orm/sqlite-core';

import { getDatabasePath } from './paths';

/** Shared type for the two drivers `createDatabase()` can return. The two drivers produce
 * structurally similar but not identical generic types (differing only in their internal
 * run-result type), so this is the common base rather than `any`. */
export type AllSearchDatabase = SQLiteAsyncDatabase<'sync', unknown, EmptyRelations>;

// Opening a connection (below, to set pragmas) creates the database file as a side effect, even
// before any migration runs. `migrateDatabase` needs to know whether the file had real
// pre-existing content *before* that happened, so `createDatabase` records it here, keyed on the
// connection itself rather than the path string it was given — `migrateDatabase` is not
// guaranteed to be called with the exact same path string (relative vs absolute, symlink,
// trailing separator), and a path-keyed lookup would silently and permanently return `false` for
// any mismatch, skipping the backup with no error. Keying on the connection is self-cleaning
// (the `WeakMap` entry is collected with the connection) and immune to that mismatch.
const preExistingDatabases = new WeakMap<AllSearchDatabase, boolean>();

/** True when the database this connection was opened against already contained at least one
 * table (including just `__drizzle_migrations`) before `createDatabase` last opened it. Opening
 * a connection creates a 4096-byte file as a side effect of the two `PRAGMA`s below, before any
 * table exists, so checking file size instead of table count would misclassify a database that
 * died between "file created" and "first migration committed" as pre-existing — and back it up
 * anyway, producing a permanent `.backup` of a database with zero tables. */
export function wasDatabasePreExisting(db: AllSearchDatabase): boolean {
  return preExistingDatabases.get(db) ?? false;
}

/** Opens a new, unmemoised database connection so tests can each get an independent database.
 * Enables foreign keys and WAL mode on every connection — SQLite has foreign keys off by
 * default, and without them every `ON DELETE CASCADE` in the schema silently does nothing. */
export async function createDatabase(path?: string): Promise<AllSearchDatabase> {
  const dbPath = path ?? getDatabasePath();

  // `drizzle-orm/node-sqlite` and `node:sqlite` must be loaded via dynamic import: under Bun,
  // `node:sqlite` does not exist and a static import throws at module-load time. Symmetrically,
  // `bun:sqlite` does not exist under Node.
  if (typeof Bun !== 'undefined') {
    const [{ drizzle }, { Database }] = await Promise.all([
      import('drizzle-orm/bun-sqlite'),
      import('bun:sqlite'),
    ]);
    const client = new Database(dbPath);
    client.run('PRAGMA foreign_keys = ON');
    client.run('PRAGMA journal_mode = WAL');
    const db = drizzle({ client });
    preExistingDatabases.set(db, await hasAnyTable(db));
    return db;
  }

  const [{ drizzle }, { DatabaseSync }] = await Promise.all([
    import('drizzle-orm/node-sqlite'),
    import('node:sqlite'),
  ]);
  const client = new DatabaseSync(dbPath);
  client.exec('PRAGMA foreign_keys = ON');
  client.exec('PRAGMA journal_mode = WAL');
  const db = drizzle({ client });
  preExistingDatabases.set(db, await hasAnyTable(db));
  return db;
}

/** Whether the connection's database already has any table — checked with a query, not the file
 * size, since the file exists (and is non-empty) the moment the connection above is opened, well
 * before any table is created. */
async function hasAnyTable(db: AllSearchDatabase): Promise<boolean> {
  const rows = await db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table' LIMIT 1`
  );
  return rows.length > 0;
}

let databasePromise: Promise<AllSearchDatabase> | undefined;

/** Memoised database connection for app use. */
export function getDatabase(): Promise<AllSearchDatabase> {
  if (!databasePromise) {
    databasePromise = createDatabase();
  }
  return databasePromise;
}
