import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';
import { spawn, type ChildProcess } from 'node:child_process';
import { test as base } from '@playwright/test';

const GOLDEN_DATABASE_PATH = resolve(__dirname, '..', 'fixtures', 'golden.db');
const SERVER_READY_TIMEOUT_MS = 90_000;

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
      const server = startServer(port, databasePath);

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
  context: async ({ browser, e2eServer }, run) => {
    const context = await browser.newContext({ baseURL: e2eServer.url });
    try {
      await run(context);
    } finally {
      await context.close();
    }
  },
});

export { expect } from '@playwright/test';

function startServer(port: number, databasePath: string): ChildProcess {
  return spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      cwd: process.cwd(),
      env: { ...process.env, ALLSEARCH_DB_PATH: databasePath },
      stdio: 'ignore',
    }
  );
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
