import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { sql } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { getMigrationsToRun } from 'drizzle-orm/migrator.utils';

import { wasDatabasePreExisting, type AllSearchDatabase } from './client';

type SqliteMigrateFn = (db: AllSearchDatabase, config: { migrationsFolder: string }) => void;

type DrizzleMigrationsRow = { id: number; hash: string; created_at: string; name: string | null };

/** Forward-only migration runner. Backs up the database file before applying any migration —
 * a failed migration on a server is an outage, but here it is a stranger's irreplaceable data. */
export async function migrateDatabase(db: AllSearchDatabase, dbPath: string): Promise<void> {
  const migrationsFolder = resolveMigrationsFolder();
  const pendingMigrations = getPendingMigrations(
    readMigrationFiles({ migrationsFolder }),
    await getAppliedMigrations(db)
  );
  if (pendingMigrations.length === 0) {
    return;
  }

  let backupPath: string | undefined;
  if (wasDatabasePreExisting(db)) {
    // `VACUUM INTO` is SQLite's own atomic, consistent snapshot: unlike a checkpoint-then-copy,
    // it can't be left half-done by a concurrent reader pinning an older WAL snapshot, and it
    // never silently produces a corrupt file.
    backupPath = `${dbPath}.${compactIsoTimestamp(new Date())}.backup`;
    db.run(sql`VACUUM INTO ${backupPath}`);
  }

  try {
    const migrate = await getMigrateFn();
    migrate(db, { migrationsFolder });
  } catch (err) {
    if (backupPath) {
      console.error(`Migration failed. Your data was backed up to: ${backupPath}`);
    }
    throw err;
  }
}

/** Local migrations not yet recorded in `__drizzle_migrations`, using the same name-based
 * comparison `drizzle-orm`'s own migrator uses. */
function getPendingMigrations(
  localMigrations: ReturnType<typeof readMigrationFiles>,
  dbMigrations: DrizzleMigrationsRow[]
) {
  return getMigrationsToRun({ localMigrations, dbMigrations });
}

async function getAppliedMigrations(db: AllSearchDatabase): Promise<DrizzleMigrationsRow[]> {
  try {
    return await db.all<DrizzleMigrationsRow>(
      sql`SELECT id, hash, created_at, name FROM __drizzle_migrations`
    );
  } catch (err) {
    // The driver's "no such table" reason lands on `err.cause`, not `err.message` — drizzle
    // wraps it in a generic `DrizzleQueryError` whose own message is just the failed query text.
    const cause = err instanceof Error ? err.cause : undefined;
    const reason = cause instanceof Error ? cause.message : undefined;
    if (reason && /no such table/i.test(reason)) {
      // Table doesn't exist yet: everything is pending.
      return [];
    }
    throw err;
  }
}

let migrationsFolderCache: string | undefined;

/** Resolves the `drizzle/` migrations folder. `process.cwd()` is correct today because the only
 * runtime is `next dev`/`next start`, both invoked from the repo root — `import.meta.dirname` is
 * used only as an optional refinement when it happens to be defined, since inside the Turbopack
 * server bundle it is `undefined` (not the repo-root path a plain Node/Bun module would report),
 * and `join(undefined, ...)` throws. This is called lazily, from inside `migrateDatabase`, so a
 * bad resolution surfaces as a migration error rather than preventing this module from ever being
 * imported (which previously took down the whole server before it could boot). Packaging this
 * folder alongside a distributable binary is out of scope here — issue 20 owns that. */
function resolveMigrationsFolder(): string {
  if (migrationsFolderCache) {
    return migrationsFolderCache;
  }

  const folder =
    typeof import.meta.dirname === 'string'
      ? join(import.meta.dirname, '..', '..', 'drizzle')
      : join(process.cwd(), 'drizzle');
  if (!existsSync(folder)) {
    throw new Error(
      `Migrations folder not found at "${folder}". The drizzle/ directory must ship alongside the app.`
    );
  }

  migrationsFolderCache = folder;
  return folder;
}

function compactIsoTimestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

// `drizzle-orm/node-sqlite` must be loaded via dynamic `await import()`: under Bun, `node:sqlite`
// does not exist and a static import throws at module-load time. Symmetrically for `bun-sqlite`
// under Node.
async function getMigrateFn(): Promise<SqliteMigrateFn> {
  if (typeof Bun !== 'undefined') {
    const { migrate } = await import('drizzle-orm/bun-sqlite/migrator');
    return migrate as unknown as SqliteMigrateFn;
  }
  const { migrate } = await import('drizzle-orm/node-sqlite/migrator');
  return migrate as unknown as SqliteMigrateFn;
}
