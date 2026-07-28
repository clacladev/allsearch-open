import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import type { AllSearchDatabase } from '@/libs/database/client';

/** Creates a fresh temp directory and returns a database file path inside it, for tests to
 * point `ALLSEARCH_DB_PATH` at. Each call gets its own directory so tests never collide. */
export function createTempDbPath(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), `allsearch-${prefix}-`));
  return join(dir, 'test.db');
}

/** Removes the temp directory created by `createTempDbPath`, including any backups/WAL sidecars
 * left behind. */
export function cleanupTempDbPath(dbPath: string): void {
  rmSync(dirname(dbPath), { recursive: true, force: true });
}

/** Closes the SQLite connection a drizzle `AllSearchDatabase` wraps, so a test's temp directory
 * can be removed without a lingering open file handle. Drizzle's own type doesn't expose
 * `close()`, but both drivers set `$client` to the raw driver client at runtime, which does. */
export function closeDatabase(db: AllSearchDatabase): void {
  (db as unknown as { $client: { close(): void } }).$client.close();
}
