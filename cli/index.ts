/** `bunx allsearch` / `npx allsearch` command wrapper for the shared local server runtime. */

import packageJson from '../package.json' with { type: 'json' };
import { parseCliArgs, USAGE } from './args';
import { openInDefaultBrowser } from './browser';
import { AllSearchRuntime } from './runtime';

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

  const runtime = new AllSearchRuntime({ preferredPort: parsed.options.port });
  installSignalHandlers(runtime);
  const server = await runtime.start();
  console.log(`AllSearch ${packageJson.version}`);
  console.log(`  Database: ${server.databasePath}`);
  console.log(`  URL:      ${server.url}\n`);
  console.log(`Ready at ${server.url}`);
  if (parsed.options.open && !(await openInDefaultBrowser(server.url))) {
    console.log(`Could not open a browser automatically — open ${server.url} yourself.`);
  }
  return new Promise<number>(() => {});
}

function installSignalHandlers(runtime: AllSearchRuntime): void {
  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals, exitCode: number) => {
    if (shuttingDown) return;
    shuttingDown = true;
    void runtime.stop().finally(() => process.exit(exitCode));
    console.log(`\nShutting down (${signal})…`);
  };
  process.on('SIGINT', () => shutdown('SIGINT', 130));
  process.on('SIGTERM', () => shutdown('SIGTERM', 143));
  process.on('exit', () => void runtime.stop());
}

main(process.argv.slice(2))
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
