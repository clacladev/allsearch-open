import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { clearShutdownHooks, registerShutdownHook, runShutdownHooks } from '@/libs/shutdown';

beforeEach(() => clearShutdownHooks());
afterEach(() => clearShutdownHooks());

describe('runShutdownHooks', () => {
  it('runs every registered hook', async () => {
    const ran: string[] = [];
    registerShutdownHook('first', () => void ran.push('first'));
    registerShutdownHook('second', async () => void ran.push('second'));

    await runShutdownHooks();

    expect(ran.sort()).toEqual(['first', 'second']);
  });

  it('does nothing when nothing is registered', async () => {
    await expect(runShutdownHooks()).resolves.toBeUndefined();
  });

  // `instrumentation.ts`'s `register()` can run more than once in a process, so hooks are keyed by
  // name: re-registering replaces rather than queues a second copy of the same database writes.
  it('keeps only the latest hook registered under a given name', async () => {
    let runCount = 0;
    registerShutdownHook('collection-runs', () => void runCount++);
    registerShutdownHook('collection-runs', () => void runCount++);

    await runShutdownHooks();

    expect(runCount).toBe(1);
  });

  // Quitting must not be blocked by one misbehaving hook: this sits between Ctrl-C and exit.
  it('still runs the other hooks when one throws, and does not reject', async () => {
    const consoleError = spyOn(console, 'error').mockImplementation(() => {});
    let didOtherHookRun = false;
    registerShutdownHook('broken', () => {
      throw new Error('boom');
    });
    registerShutdownHook('fine', () => void (didOtherHookRun = true));

    await expect(runShutdownHooks()).resolves.toBeUndefined();

    expect(didOtherHookRun).toBe(true);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('gives up on a hook that never settles rather than making the app un-quittable', async () => {
    const consoleError = spyOn(console, 'error').mockImplementation(() => {});
    registerShutdownHook('wedged', () => new Promise<void>(() => {}));

    const startedAt = Date.now();
    await runShutdownHooks(50);

    expect(Date.now() - startedAt).toBeLessThan(2_000);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  // The registry lives on `globalThis` under a `Symbol.for` key precisely so the CLI bundle and
  // the standalone server bundle — two module graphs, so two copies of this file's module state —
  // share one list. That key is the contract between them, so it is asserted directly: a second
  // copy of this module would see exactly this global.
  it('keeps its registry on a globalThis symbol that a second copy of this module would find', async () => {
    registerShutdownHook('from-this-module', () => {});

    const registry = (globalThis as Record<symbol, unknown>)[
      Symbol.for('allsearch.shutdownHooks')
    ] as Map<string, () => void>;
    expect(registry).toBeInstanceOf(Map);
    expect(registry.has('from-this-module')).toBe(true);

    // Stand in for the other bundle writing to the same shared registry.
    let ranFromOtherInstance = false;
    registry.set('from-other-module', () => void (ranFromOtherInstance = true));

    await runShutdownHooks();

    expect(ranFromOtherInstance).toBe(true);
  });
});
