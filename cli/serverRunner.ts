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

void import(pathToFileURL(serverEntry).href).catch((error) => {
  console.error(error);
  process.exit(1);
});
