/** Signal-owning process for the standalone server. Kept separate so both desktop and CLI can
 * stop Next cleanly while its instrumentation shutdown hooks share this process's global registry. */

import { pathToFileURL } from 'node:url';

import { runShutdownHooks } from '../libs/shutdown';

const serverEntry = process.argv[2];
if (!serverEntry) throw new Error('AllSearch server runner requires a standalone server entry path.');

let stopping = false;
const shutdown = (signal: NodeJS.Signals, exitCode: number) => {
  if (stopping) return;
  stopping = true;
  void runShutdownHooks().finally(() => process.exit(exitCode));
  console.log(`\nShutting down (${signal})…`);
};
process.on('SIGINT', () => shutdown('SIGINT', 130));
process.on('SIGTERM', () => shutdown('SIGTERM', 143));

// A CLI or Electron process can be force-killed without running its shutdown handler. The lock
// belongs to this child, and this watchdog makes that ownership meaningful: once the launcher is
// gone, stop the server before another launcher is allowed to reclaim its database lock.
const parentPid = Number(process.env.ALLSEARCH_PARENT_PID);
if (Number.isInteger(parentPid) && parentPid > 0) {
  const parentWatch = setInterval(() => {
    try {
      process.kill(parentPid, 0);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') return;
      shutdown('SIGTERM', 143);
    }
  }, 250);
  parentWatch.unref();
}

void import(pathToFileURL(serverEntry).href).catch((error) => {
  console.error(error);
  process.exit(1);
});
