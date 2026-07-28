import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { sql } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { getMigrationsToRun } from 'drizzle-orm/migrator.utils';

import { wasDatabasePreExisting, type AllSearchDatabase } from './client';

type SqliteMigrateFn = (db: AllSearchDatabase, config: { migrationsFolder: string }) => void;

type DrizzleMigrationsRow = { id: number; hash: string; created_at: string; name: string | null };

/** Forward-only migration runner. Backs up the database file before applying any migration —
 * a failed migration on a server is an outage, but here it is a stranger's irreplaceable data.
 * `migrationsFolder` defaults to the real `drizzle/` folder; tests pass their own so the upgrade
 * path (database at migration N, migrate to N+1) can be exercised without touching the app's
 * real migrations. */
export async function migrateDatabase(
  db: AllSearchDatabase,
  dbPath: string,
  migrationsFolder: string = resolveMigrationsFolder()
): Promise<void> {
  const pendingMigrations = getPendingMigrations(
    readMigrationFiles({ migrationsFolder }),
    await getAppliedMigrations(db)
  );
  if (pendingMigrations.length === 0) {
    return;
  }

  let backupPath: string | undefined;
  if (wasDatabasePreExisting(db)) {
    backupPath = uniqueBackupPath(dbPath);
    try {
      // `VACUUM INTO` is SQLite's own atomic, consistent snapshot: unlike a checkpoint-then-copy,
      // it can't be left half-done by a concurrent reader pinning an older WAL snapshot, and it
      // never silently produces a corrupt file.
      db.run(sql`VACUUM INTO ${backupPath}`);
    } catch (err) {
      // Disk full or a read-only directory otherwise propagate as a raw `DrizzleQueryError` whose
      // message is just the failed query text, with the real reason buried on `.cause` — useless
      // to a desktop-app user who must act on it.
      const cause = err instanceof Error ? err.cause : undefined;
      const reason =
        cause instanceof Error ? cause.message : err instanceof Error ? err.message : String(err);

      // `uniqueBackupPath` makes a collision at this exact path practically impossible (pid +
      // millisecond timestamp). If SQLite still reports "file already exists", `VACUUM INTO`
      // left the file at `backupPath` completely untouched — by definition it wasn't written by
      // us, so it may be another process's valid, complete backup. Never delete it. In every
      // other failure, any bytes SQLite did write are useless and are removed so they can never
      // later be mistaken for a valid backup — this can't undo a process killed mid-`VACUUM`;
      // nothing here runs in that case.
      if (!/already exists/i.test(reason)) {
        try {
          rmSync(backupPath, { force: true });
        } catch {
          // Best-effort cleanup only — must not replace the error thrown below.
        }
      }
      throw new Error(
        `Could not back up your database before migrating (${backupPath}): ${reason}. Migration aborted.`,
        { cause: err }
      );
    }
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
    // The driver's "no such table"/"no such column" reason lands on `err.cause`, not
    // `err.message` — drizzle wraps it in a generic `DrizzleQueryError` whose own message is
    // just the failed query text.
    const cause = err instanceof Error ? err.cause : undefined;
    const reason = cause instanceof Error ? cause.message : undefined;
    if (reason && /no such (table|column)/i.test(reason)) {
      // "no such table": the table doesn't exist yet, so everything is pending. "no such
      // column": the table predates the `name` column (an older `__drizzle_migrations` layout);
      // drizzle's own `migrate()` calls `upgradeSyncIfNeeded` first, which would migrate that
      // layout before we ever get here in practice, but if it somehow doesn't, we deliberately
      // treat it the same as "everything pending" rather than crashing startup.
      return [];
    }
    throw err;
  }
}

/** `<dbPath>.<millisecond-precision compact ISO timestamp>.<pid>.backup`. The millisecond
 * precision plus the pid make a collision at this exact path practically impossible: two
 * `migrateDatabase` calls in the same process can't land in the same millisecond (a `VACUUM INTO`
 * takes far longer than that), and two different processes never share a pid. The `existsSync`
 * check is a last-resort sanity check, not a mechanism this code relies on for uniqueness — if it
 * ever fires, something stranger than an ordinary naming collision is going on, so this fails
 * loudly instead of silently deleting or overwriting anything. */
function uniqueBackupPath(dbPath: string): string {
  const candidate = `${dbPath}.${compactIsoTimestamp(new Date())}.${process.pid}.backup`;
  if (existsSync(candidate)) {
    throw new Error(`Refusing to back up your database: a file already exists at ${candidate}.`);
  }
  return candidate;
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
  return date.toISOString().replace(/[-:.]/g, '');
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
