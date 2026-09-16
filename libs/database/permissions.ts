import { chmod } from 'node:fs/promises';

// Server-only module. Imported from instrumentation.ts via a
// `turbopackIgnore` dynamic import so the Edge build never traces it.

// The database can hold provider API keys in plaintext (see libs/database/Settings) — restrict
// the file, and its WAL/SHM siblings (which can carry the same rows mid-transaction), to
// owner-only access. Skipped on Windows, which has no POSIX permission bits. Best-effort: a
// failure here must not block app startup, but this app ships no telemetry, so console.warn is
// the only channel available to surface it rather than swallowing it silently.
export async function restrictDatabaseFilePermissions(dbPath: string): Promise<void> {
  if (process.platform === 'win32') return;

  for (const path of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    try {
      await chmod(path, 0o600);
    } catch (error) {
      console.warn(`Failed to restrict permissions on ${path}`, error);
    }
  }
}
