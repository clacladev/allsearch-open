import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';
import { spawn, type ChildProcess } from 'node:child_process';
import { test as base } from '@playwright/test';

const GOLDEN_DATABASE_PATH = resolve(__dirname, '..', 'fixtures', 'golden.db');
const FIXED_TIME_PRELOAD_PATH = resolve(__dirname, 'fixedTime.cjs');
const SERVER_READY_TIMEOUT_MS = 90_000;
const VISUAL_PROJECT_NAMES = new Set(['visual-light', 'visual-dark', 'visual-mobile']);

export const FIXED_E2E_TIME = '2026-08-12T12:00:00.000Z';

type E2eServer = {
  databasePath: string;
  url: string;
};

type E2eFixtures = {
  e2eServer: E2eServer;
};

/** Each test gets a complete SQLite copy and a server process pointed at it.
 * Database selection happens when Next first loads the app, so sharing one
 * server would still make parallel browser tests share mutable state. */
export const test = base.extend<E2eFixtures>({
  e2eServer: [
    async ({}, run, testInfo) => {
      if (!existsSync(GOLDEN_DATABASE_PATH)) {
        throw new Error(
          `Missing Playwright golden database at ${GOLDEN_DATABASE_PATH}. Run \`bun run e2e:prepare\` first.`
        );
      }

      const directory = mkdtempSync(join(tmpdir(), `allsearch-e2e-${safeName(testInfo.title)}-`));
      const databasePath = join(directory, 'allsearch.db');
      copyFileSync(GOLDEN_DATABASE_PATH, databasePath);

      const port = await getFreePort();
      const url = `http://127.0.0.1:${port}`;
      const server = startServer(port, databasePath, isVisualProject(testInfo.project.name));

      try {
        await waitForServer(url, server);
        await run({ databasePath, url });
      } finally {
        await stopServer(server);
        rmSync(directory, { recursive: true, force: true });
      }
    },
    { scope: 'test' },
  ],
  context: async ({ browser, e2eServer }, run, testInfo) => {
    const isVisual = isVisualProject(testInfo.project.name);
    const context = await browser.newContext({
      baseURL: e2eServer.url,
      ...(isVisual ? { timezoneId: 'UTC' } : {}),
    });
    try {
      if (isVisual) await context.addInitScript(freezeBrowserDate, FIXED_E2E_TIME);
      await run(context);
    } finally {
      await context.close();
    }
  },
});

export { expect } from '@playwright/test';

function startServer(port: number, databasePath: string, isVisual: boolean): ChildProcess {
  const nodeOptions = [process.env.NODE_OPTIONS, `--require=${FIXED_TIME_PRELOAD_PATH}`]
    .filter(Boolean)
    .join(' ');
  return spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ALLSEARCH_DB_PATH: databasePath,
        ...(isVisual
          ? { ALLSEARCH_E2E_FIXED_TIME: FIXED_E2E_TIME, NODE_OPTIONS: nodeOptions, TZ: 'UTC' }
          : {}),
      },
      stdio: 'ignore',
    }
  );
}

function isVisualProject(projectName: string): boolean {
  return VISUAL_PROJECT_NAMES.has(projectName);
}

function freezeBrowserDate(fixedTime: string): void {
  const nativeDate = Date;
  const fixedTimestamp = nativeDate.parse(fixedTime);
  const nativeStartTimestamp = nativeDate.now();

  function FixedDate(...args: unknown[]): Date {
    if (!new.target) return new nativeDate(fixedTimestamp).toString() as unknown as Date;
    return Reflect.construct(nativeDate, args.length === 0 ? [fixedTimestamp] : args, new.target);
  }

  Object.setPrototypeOf(FixedDate, nativeDate);
  FixedDate.prototype = nativeDate.prototype;
  FixedDate.now = () => fixedTimestamp + nativeDate.now() - nativeStartTimestamp;
  Object.defineProperty(globalThis, 'Date', { configurable: true, writable: true, value: FixedDate });
}

async function getFreePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolvePort, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolvePort());
  });
  const address = server.address();
  await new Promise<void>((resolveClose, reject) => server.close((error) => (error ? reject(error) : resolveClose())));
  if (!address || typeof address === 'string') throw new Error('Could not allocate a local port for Playwright.');
  return address.port;
}

async function waitForServer(url: string, server: ChildProcess): Promise<void> {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Playwright server exited before it was ready (exit code ${server.exitCode}).`);
    }
    try {
      const response = await fetch(`${url}/logo.svg`, { signal: AbortSignal.timeout(5_000) });
      if (response.status < 500) return;
    } catch {
      // The process is still loading Next and running migrations.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Playwright server did not become ready within ${SERVER_READY_TIMEOUT_MS / 1000} seconds.`);
}

async function stopServer(server: ChildProcess): Promise<void> {
  if (server.exitCode !== null) return;
  server.kill('SIGTERM');
  await Promise.race([
    new Promise<void>((resolveExit) => server.once('exit', () => resolveExit())),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 10_000)),
  ]);
  if (server.exitCode === null) server.kill('SIGKILL');
}

function safeName(title: string): string {
  return title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 48) || 'test';
}
