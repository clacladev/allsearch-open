import { existsSync, mkdirSync } from 'node:fs';
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
