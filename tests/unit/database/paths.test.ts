import { afterEach, describe, expect, it } from 'bun:test';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { getDatabaseFileInfo } from '@/libs/database/paths';
import { cleanupTempDbPath, createTempDbPath } from './testHelpers';

const originalDbPath = process.env.ALLSEARCH_DB_PATH;
const createdPaths: string[] = [];

function useTempDatabasePath(): string {
  const dbPath = createTempDbPath('paths');
  createdPaths.push(dbPath);
  process.env.ALLSEARCH_DB_PATH = dbPath;
  return dbPath;
}

afterEach(() => {
  createdPaths.splice(0).forEach(cleanupTempDbPath);
  if (originalDbPath === undefined) delete process.env.ALLSEARCH_DB_PATH;
  else process.env.ALLSEARCH_DB_PATH = originalDbPath;
});

describe('getDatabaseFileInfo', () => {
  it('reports a database that has not been created yet as empty rather than throwing', () => {
    const dbPath = useTempDatabasePath();

    const info = getDatabaseFileInfo();

    expect(info.path).toBe(dbPath);
    expect(info.directory).toBe(dirname(dbPath));
    expect(info.exists).toBe(false);
    expect(info.totalSizeBytes).toBe(0);
  });

  it('counts the main file once it exists', () => {
    const dbPath = useTempDatabasePath();
    writeFileSync(dbPath, Buffer.alloc(100));

    const info = getDatabaseFileInfo();

    expect(info.exists).toBe(true);
    expect(info.totalSizeBytes).toBe(100);
  });

  // In WAL mode recent writes sit in the sidecar until a checkpoint, so a size that ignored it
  // would under-report both disk usage and what the user must copy to move their data.
  it('adds the -wal and -shm sidecars to the total', () => {
    const dbPath = useTempDatabasePath();
    writeFileSync(dbPath, Buffer.alloc(100));
    writeFileSync(`${dbPath}-wal`, Buffer.alloc(40));
    writeFileSync(`${dbPath}-shm`, Buffer.alloc(10));

    expect(getDatabaseFileInfo().totalSizeBytes).toBe(150);
  });
});
