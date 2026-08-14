import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'bun:test';
import { AllSearchRuntime, RuntimeLockError } from '@/cli/runtime';
import { isProcessAlive, readInstanceLock } from '@/cli/instanceLock';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) Bun.spawnSync(['rm', '-rf', directory]);
});

function fixture(ignoreTermination = false): { databasePath: string; serverEntry: string; runnerEntry: string } {
  const directory = mkdtempSync(join(tmpdir(), 'allsearch-runtime-'));
  directories.push(directory);
  const serverEntry = join(directory, 'server.cjs');
  writeFileSync(
    serverEntry,
    `const http=require('node:http');const server=http.createServer((request,response)=>{response.end(process.env.ALLSEARCH_DB_PATH)});server.listen(Number(process.env.PORT),process.env.HOSTNAME);${ignoreTermination ? "process.on('SIGTERM',()=>{});" : "process.on('SIGTERM',()=>server.close(()=>process.exit(0)));"}`
  );
  const runnerEntry = join(directory, 'runner.cjs');
  writeFileSync(runnerEntry, "require(process.argv[2]);");
  return { databasePath: join(directory, 'existing.db'), serverEntry, runnerEntry };
}

describe('AllSearchRuntime', () => {
  it('starts on localhost, retains the selected database path, and releases its lock at shutdown', async () => {
    const { databasePath, serverEntry, runnerEntry } = fixture();
    writeFileSync(databasePath, 'existing database contents');
    const runtime = new AllSearchRuntime({ databasePath, serverEntry, runnerEntry, packageRoot: process.cwd() });

    const server = await runtime.start();
    expect(server.url).toStartWith('http://127.0.0.1:');
    expect(await (await fetch(server.url)).text()).toBe(databasePath);
    expect(existsSync(join(dirname(databasePath), 'allsearch.lock'))).toBe(true);
    const lock = readInstanceLock(join(dirname(databasePath), 'allsearch.lock'));
    expect(lock?.pid).not.toBe(process.pid);
    expect(lock?.parentPid).toBe(process.pid);
    expect(lock && isProcessAlive(lock.pid)).toBe(true);

    await Promise.all([runtime.stop(), runtime.stop()]);
    expect(existsSync(join(dirname(databasePath), 'allsearch.lock'))).toBe(false);
    expect(Bun.file(databasePath).size).toBe('existing database contents'.length);
  });

  it('uses the same lock for desktop and CLI launchers', async () => {
    const { databasePath, serverEntry, runnerEntry } = fixture();
    const first = new AllSearchRuntime({ databasePath, serverEntry, runnerEntry, packageRoot: process.cwd() });
    const second = new AllSearchRuntime({ databasePath, serverEntry, runnerEntry, packageRoot: process.cwd() });
    await first.start();
    await expect(second.start()).rejects.toBeInstanceOf(RuntimeLockError);
    await first.stop();
  });

  it('waits for a SIGKILLed server child to exit before releasing its database lock', async () => {
    const { databasePath, serverEntry, runnerEntry } = fixture(true);
    const runtime = new AllSearchRuntime({
      databasePath,
      serverEntry,
      runnerEntry,
      packageRoot: process.cwd(),
      stopTimeoutMs: 10,
    });
    await runtime.start();
    const lockPath = join(dirname(databasePath), 'allsearch.lock');
    const childPid = readInstanceLock(lockPath)?.pid;

    await runtime.stop();

    expect(childPid).toBeDefined();
    expect(isProcessAlive(childPid!)).toBe(false);
    expect(existsSync(lockPath)).toBe(false);
  });
});
