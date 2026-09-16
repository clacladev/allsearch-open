import { existsSync, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const APP_DIR_NAME = 'AllSearch';
const DB_FILE_NAME = 'allsearch.db';

/** Platform application-data directory for AllSearch's database file, honouring
 * `ALLSEARCH_DB_PATH` as a test/dev override. Creates the parent directory if missing. */
export function getDatabasePath(): string {
  const overridePath = process.env.ALLSEARCH_DB_PATH;
  const dbPath = overridePath || join(getAppDataDir(), APP_DIR_NAME, DB_FILE_NAME);

  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return dbPath;
}

export type DatabaseFileInfo = {
  /** Absolute path of the main database file. */
  path: string;
  /** Directory holding the database and its sidecar files. */
  directory: string;
  /** Whether the main database file has been created yet. */
  exists: boolean;
  /** Size of the main file plus its `-wal` / `-shm` sidecars, in bytes. */
  totalSizeBytes: number;
};

/** Size and location of the database, for the Data section of Settings (issue 19).
 *
 * The `-wal` sidecar is counted deliberately: in WAL mode recent writes live there until a
 * checkpoint, so reporting the main file alone would understate both the size on disk and what
 * the user has to copy to move their data to another machine. */
export function getDatabaseFileInfo(): DatabaseFileInfo {
  const path = getDatabasePath();
  const sidecarPaths = [path, `${path}-wal`, `${path}-shm`];

  const totalSizeBytes = sidecarPaths.reduce((total, sidecarPath) => {
    try {
      return total + statSync(sidecarPath).size;
    } catch {
      return total;
    }
  }, 0);

  return { path, directory: dirname(path), exists: existsSync(path), totalSizeBytes };
}

function getAppDataDir(): string {
  switch (process.platform) {
    case 'darwin':
      return join(homedir(), 'Library', 'Application Support');
    case 'win32':
      return process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
    default:
      return process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share');
  }
}
