/** Process-wide shutdown hooks, shared between the CLI and the Next.js server it boots.
 *
 * `bunx allsearch` runs the standalone Next.js server *inside the CLI process* (see
 * `cli/index.ts`), so the CLI owns SIGINT/SIGTERM but the work that has to happen before exit —
 * returning an in-flight Collection Run to a resumable state — lives on the server side, in
 * `instrumentation.ts`. The two halves cannot import each other: the server is a pre-bundled
 * `.next/standalone/server.js` with its own module graph, so a module-level array here would be
 * two separate arrays, one per bundle.
 *
 * The registry therefore hangs off `globalThis` under a `Symbol.for` key, which both bundles
 * resolve to the same symbol and so to the same array. Importing this module from either side is
 * then safe regardless of how many copies of the module text exist. */

type ShutdownHook = () => void | Promise<void>;

const REGISTRY_KEY = Symbol.for('allsearch.shutdownHooks');

type ShutdownRegistry = Map<string, ShutdownHook>;

type GlobalWithRegistry = typeof globalThis & { [REGISTRY_KEY]?: ShutdownRegistry };

function getRegistry(): ShutdownRegistry {
  const globalWithRegistry = globalThis as GlobalWithRegistry;
  const registry = (globalWithRegistry[REGISTRY_KEY] ??= new Map());
  return registry;
}

/** Registers `hook` to run before the process exits, replacing any hook already registered under
 * `name`. Keyed by name rather than appended because `instrumentation.ts`'s `register()` can run
 * more than once in a process (Turbopack can resolve a module to more than one instance), and a
 * hook that ran twice at shutdown would issue the same writes twice. */
export function registerShutdownHook(name: string, hook: ShutdownHook): void {
  getRegistry().set(name, hook);
}

/** Runs every registered hook, in parallel, and resolves once they have all settled or
 * `timeoutMs` has elapsed — whichever comes first. Never rejects: a hook that throws is logged
 * and the rest still run. The timeout exists because this sits between the user pressing Ctrl-C
 * and the process exiting; a hook wedged on a hung write must not make the app un-quittable, and
 * everything a hook does here is also redone at the next boot (`releaseRunningCollectionRuns`),
 * so timing one out costs correctness nothing. */
export async function runShutdownHooks(timeoutMs = 5_000): Promise<void> {
  const registry = getRegistry();
  if (registry.size === 0) return;

  const hookPromises = [...registry].map(async ([name, hook]) => {
    try {
      await hook();
    } catch (error) {
      console.error(`Shutdown hook "${name}" failed`, error);
    }
  });

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timeoutHandle = setTimeout(() => {
      console.error(`Shutdown hooks did not finish within ${timeoutMs}ms; exiting anyway.`);
      resolve();
    }, timeoutMs);
    // Without this the pending timer would itself keep the event loop alive for the full
    // duration, turning the timeout's ceiling into a floor on how long quitting takes.
    timeoutHandle.unref?.();
  });

  try {
    await Promise.race([Promise.all(hookPromises), timeout]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

/** Test seam: drops every registered hook. */
export function clearShutdownHooks(): void {
  getRegistry().clear();
}
