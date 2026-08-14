/** Shared lifecycle for the local Next.js server used by both the CLI and Electron shell. */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { getDatabasePath } from '../libs/database/paths';
import { acquireInstanceLock, type AcquiredLock, type InstanceLockRecord } from './instanceLock';
import { PortUnavailableError, resolveServerPort } from './port';

export const LOCALHOST = '127.0.0.1';
const LOCK_FILE_NAME = 'allsearch.lock';
const READY_TIMEOUT_MS = 90_000;
const READY_POLL_INTERVAL_MS = 250;
const STOP_TIMEOUT_MS = 10_000;

export type RuntimeOptions = {
  databasePath?: string;
  packageRoot?: string;
  preferredPort?: number;
  runnerEntry?: string;
  serverEntry?: string;
};

export type RunningServer = { url: string; port: number; databasePath: string };

/** Starts the standalone server in a child process and owns its database lock for its lifetime.
 * The server is deliberately loopback-only: the local database contains provider keys and the app
 * has no authentication boundary. */
export class AllSearchRuntime {
  private child: ChildProcess | undefined;
  private lock: AcquiredLock | undefined;
  private stopping: Promise<void> | undefined;
  private running: RunningServer | undefined;

  constructor(private readonly options: RuntimeOptions = {}) {}

  async start(): Promise<RunningServer> {
    if (this.running) return this.running;

    const serverEntry = this.resolveServerEntry();
    const databasePath = this.options.databasePath ?? getDatabasePath();
    const port = await resolveServerPort({ host: LOCALHOST, preferred: this.options.preferredPort });
    const url = `http://${LOCALHOST}:${port}`;
    const record: InstanceLockRecord = { pid: process.pid, port, url, startedAt: new Date().toISOString() };
    const lockPath = join(dirname(databasePath), LOCK_FILE_NAME);
    const lock = acquireInstanceLock(lockPath, record);
    if (!lock.acquired) throw new RuntimeLockError(describeRunningInstance(lock.heldBy, lockPath));

    this.lock = lock;
    const child = spawn(process.execPath, [this.runnerEntry, serverEntry], {
      cwd: dirname(serverEntry),
      env: {
        ...process.env,
        PORT: String(port),
        HOSTNAME: LOCALHOST,
        NEXT_MANUAL_SIG_HANDLE: '1',
        ALLSEARCH_DB_PATH: databasePath,
        ...(process.versions.electron ? { ELECTRON_RUN_AS_NODE: '1' } : {}),
        // The server starts from the standalone directory, while migrations intentionally remain
        // beside the packaged application root in the CLI and desktop bundles.
        ALLSEARCH_MIGRATIONS_DIR: process.env.ALLSEARCH_MIGRATIONS_DIR ?? join(this.packageRoot, 'drizzle'),
      },
      stdio: 'inherit',
    });
    this.child = child;
    child.once('exit', () => {
      this.child = undefined;
      this.running = undefined;
      this.releaseLock();
    });

    try {
      if (!(await waitForServerReady(url, child))) {
        throw new Error(`The server did not respond within ${READY_TIMEOUT_MS / 1000}s.`);
      }
      this.running = { url, port, databasePath };
      return this.running;
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  /** Stops once even if normal shutdown, a signal, and a startup failure overlap. */
  stop(): Promise<void> {
    if (this.stopping) return this.stopping;
    this.stopping = this.stopServer();
    return this.stopping;
  }

  private async stopServer(): Promise<void> {
    const child = this.child;
    if (!child || child.exitCode !== null) {
      this.releaseLock();
      return;
    }

    child.kill('SIGTERM');
    await Promise.race([
      new Promise<void>((resolve) => child.once('exit', () => resolve())),
      sleep(STOP_TIMEOUT_MS),
    ]);
    if (child.exitCode === null) child.kill('SIGKILL');
    this.releaseLock();
  }

  private releaseLock(): void {
    this.lock?.release();
    this.lock = undefined;
  }

  private get packageRoot(): string {
    return this.options.packageRoot ?? dirname(dirname(fileURLToPath(import.meta.url)));
  }

  private get runnerEntry(): string {
    const runner = this.options.runnerEntry ?? join(dirname(fileURLToPath(import.meta.url)), 'serverRunner.cjs');
    if (!existsSync(runner)) throw new Error(`AllSearch's server runner is missing (looked in ${runner}).`);
    return runner;
  }

  private resolveServerEntry(): string {
    const serverEntry = this.options.serverEntry ?? process.env.ALLSEARCH_SERVER_ENTRY ?? join(this.packageRoot, '.next', 'standalone', 'server.js');
    if (!existsSync(serverEntry)) {
      throw new Error(
        `AllSearch's server build is missing (looked in ${serverEntry}). Build it first with \`bun run build\`.`
      );
    }
    return serverEntry;
  }
}

export class RuntimeLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuntimeLockError';
  }
}

export { PortUnavailableError };

export function describeRunningInstance(heldBy: InstanceLockRecord | undefined, lockPath: string): string {
  if (!heldBy) return `AllSearch appears to be running already (lock file: ${lockPath}).`;
  return [
    `AllSearch is already running (process ${heldBy.pid}) at ${heldBy.url}.`,
    'Open that URL, or quit the running instance first.',
    'Two servers sharing one database file can corrupt it, so this one will not start.',
  ].join('\n');
}

async function waitForServerReady(url: string, child: ChildProcess): Promise<boolean> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) return false;
    try {
      await fetch(`${url}/logo.svg`, { redirect: 'manual', signal: AbortSignal.timeout(5_000) });
      return true;
    } catch {
      await sleep(READY_POLL_INTERVAL_MS);
    }
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
