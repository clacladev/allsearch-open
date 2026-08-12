/**
 * `bunx allsearch` / `npx allsearch` — boots the standalone Next.js server on this machine and
 * opens the user's own browser at it (ADR 0010). No desktop shell, no hosted service.
 *
 * The server is started *in this process* rather than as a child: it makes Ctrl-C a single,
 * ordered sequence (stop accepting work, return any in-flight Collection Run to a resumable
 * state, drop the single-instance lock, exit) instead of a signal relay between two processes
 * that can each exit at the wrong moment. `NEXT_MANUAL_SIG_HANDLE` stops Next.js installing its
 * own SIGINT/SIGTERM handlers, which would otherwise call `process.exit()` from a parallel async
 * cleanup and could cut the database work below short.
 *
 * Built to `dist/cli.mjs` by `bun run build:cli`; see `scripts/buildCli.ts`.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import packageJson from '../package.json' with { type: 'json' };
import { getDatabasePath } from '../libs/database/paths';
import { runShutdownHooks } from '../libs/shutdown';
import { parseCliArgs, USAGE } from './args';
import { openInDefaultBrowser } from './browser';
import { acquireInstanceLock, type InstanceLockRecord } from './instanceLock';
import { PortUnavailableError, resolveServerPort } from './port';

/** Loopback only, deliberately. The database holds provider API keys in plaintext (see
 * `libs/database/Settings`) and there is no authentication anywhere in the app, so binding
 * `0.0.0.0` would publish the user's keys and Brand data to every machine on their network — a
 * coffee-shop Wi-Fi away from a stranger's browser. */
const HOST = '127.0.0.1';

const LOCK_FILE_NAME = 'allsearch.lock';

/** How long to wait for the server to answer its first request before giving up on opening a
 * browser. Generous: the very first boot also creates the database and runs every migration. */
const READY_TIMEOUT_MS = 90_000;
const READY_POLL_INTERVAL_MS = 250;

async function main(argv: string[]): Promise<number> {
  const parsed = parseCliArgs(argv);

  if (parsed.kind === 'help') {
    console.log(USAGE);
    return 0;
  }
  if (parsed.kind === 'version') {
    console.log(packageJson.version);
    return 0;
  }
  if (parsed.kind === 'error') {
    console.error(`${parsed.message}\n\n${USAGE}`);
    return 1;
  }

  const serverEntry = resolveServerEntry();
  if (!serverEntry) return 1;

  // Creates the application-data directory as a side effect, so the lock file below has somewhere
  // to live even on a first run. The database itself is created and migrated by the server's
  // `instrumentation.ts`, not here.
  const databasePath = getDatabasePath();
  const lockPath = join(dirname(databasePath), LOCK_FILE_NAME);

  let port: number;
  try {
    port = await resolveServerPort({ host: HOST, preferred: parsed.options.port });
  } catch (error) {
    console.error(error instanceof PortUnavailableError ? error.message : error);
    return 1;
  }

  const url = `http://${HOST}:${port}`;
  const record: InstanceLockRecord = {
    pid: process.pid,
    port,
    url,
    startedAt: new Date().toISOString(),
  };

  const lock = acquireInstanceLock(lockPath, record);
  if (!lock.acquired) {
    console.error(describeRunningInstance(lock.heldBy, lockPath));
    return 1;
  }

  installSignalHandlers(lock.release);

  process.env.PORT = String(port);
  process.env.HOSTNAME = HOST;
  process.env.NEXT_MANUAL_SIG_HANDLE = '1';
  // The migration SQL is read from disk at runtime, and the server `chdir`s into
  // `.next/standalone/` before any of our code runs, so the folder is pinned explicitly here
  // rather than left to be guessed from the working directory (see `libs/database/migrate.ts`).
  process.env.ALLSEARCH_MIGRATIONS_DIR ??= join(getPackageRoot(), 'drizzle');

  console.log(`AllSearch ${packageJson.version}`);
  console.log(`  Database: ${databasePath}`);
  console.log(`  URL:      ${url}`);
  console.log('');
  console.log('Starting… (press Ctrl-C to quit)');

  // Resolves as soon as the server module has kicked off `startServer`, not when it is listening
  // — hence the readiness poll below.
  await import(pathToFileURL(serverEntry).href);

  const isReady = await waitForServerReady(url);
  if (!isReady) {
    console.error(`The server did not respond within ${READY_TIMEOUT_MS / 1000}s.`);
    console.error(`If it comes up later, open ${url} yourself.`);
    return 0;
  }

  console.log(`Ready at ${url}`);
  if (parsed.options.open) {
    const opened = await openInDefaultBrowser(url);
    if (!opened) console.log(`Could not open a browser automatically — open ${url} yourself.`);
  }

  // Never resolves: the process now lives until a signal handler exits it.
  return new Promise<number>(() => {});
}

/** Absolute path of the installed package (or the repo checkout in development). Both `cli/` in
 * the checkout and `dist/` in the published package sit exactly one level below it. */
function getPackageRoot(): string {
  return dirname(dirname(fileURLToPath(import.meta.url)));
}

/** Locates the built standalone server, printing what to do about it when it is missing rather
 * than letting an import throw a stack trace at someone who just ran `bunx allsearch`. */
function resolveServerEntry(): string | undefined {
  const override = process.env.ALLSEARCH_SERVER_ENTRY;
  const serverEntry = override || join(getPackageRoot(), '.next', 'standalone', 'server.js');

  if (!existsSync(serverEntry)) {
    console.error(`AllSearch's server build is missing (looked in ${serverEntry}).`);
    console.error('From a repository checkout, build it first: bun run build && bun run build:cli');
    return undefined;
  }
  return serverEntry;
}

function describeRunningInstance(heldBy: InstanceLockRecord | undefined, lockPath: string): string {
  if (!heldBy) {
    return `AllSearch appears to be running already (lock file: ${lockPath}).`;
  }
  return [
    `AllSearch is already running (process ${heldBy.pid}) at ${heldBy.url}.`,
    'Open that URL, or quit the running instance first.',
    'Two servers sharing one database file can corrupt it, so this one will not start.',
  ].join('\n');
}

/** Polls until the server answers an HTTP request, which — unlike the socket merely being bound —
 * means Next.js has finished booting and the browser will get a page rather than a reset. */
async function waitForServerReady(url: string): Promise<boolean> {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      await fetch(`${url}/logo.svg`, { redirect: 'manual', signal: AbortSignal.timeout(5_000) });
      return true; // Any status is proof of life; a 404 still means the handler answered.
    } catch {
      await sleep(READY_POLL_INTERVAL_MS);
    }
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Ctrl-C (SIGINT) and `kill` (SIGTERM) run the server's shutdown hooks before exiting. The one
 * that matters is registered by `instrumentation.ts`: it returns a `running` Collection Run and
 * its items to `pending`, so quitting mid-collection leaves a run that resumes on the next boot
 * instead of one that looks failed, or one that looks live with no process behind it. */
function installSignalHandlers(releaseLock: () => void): void {
  let isShuttingDown = false;

  const shutdown = (signal: NodeJS.Signals, exitCode: number) => {
    // Interactive shells deliver Ctrl-C to the whole process group and can repeat it; only the
    // first one starts the sequence, and a second must not exit part-way through the first.
    if (isShuttingDown) return;
    isShuttingDown = true;

    void (async () => {
      console.log(`\nShutting down (${signal})…`);
      await runShutdownHooks();
      releaseLock();
      process.exit(exitCode);
    })();
  };

  process.on('SIGINT', () => shutdown('SIGINT', 130));
  process.on('SIGTERM', () => shutdown('SIGTERM', 143));
  // Covers every other way out (a thrown error, `process.exit` elsewhere). Synchronous-only by
  // definition, so it can do nothing but drop the lock — which is exactly the part that would
  // otherwise block the next start.
  process.on('exit', releaseLock);
}

main(process.argv.slice(2))
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
