import { afterAll, mock } from 'bun:test';

/**
 * `mock.module`, scoped to the calling test file.
 *
 * Bun runs every unit test file in one process against one shared module registry, and
 * `mock.module` mutates that registry in place — `mock.restore()` does not undo it (verified
 * against Bun 1.3.11). A stub registered by one file therefore stays live for every file that
 * runs after it, and Bun does not guarantee a stable file order, so which suites a stub reaches
 * changes run to run.
 *
 * That is not a theoretical hazard: it is exactly how the DB-backed suites started failing.
 * `tests/unit/collection/executePrompt.test.ts`'s stub of `insertPromptResponseRows` swallowed
 * the real inserts in `tests/unit/collection/collectionRun.test.ts`, and the route suites'
 * `getPromptRowsWithProjectId` / `getProjectRowWithId` stubs fed
 * `tests/unit/api/process-prompts.test.ts` the fixture ids `prompt-123` / `project-123`, which do
 * not exist in its own temp database — so materialising a Collection Run died on
 * `FOREIGN KEY constraint failed`.
 *
 * This snapshots the real module namespace before installing the stub and re-registers that
 * snapshot in `afterAll`, restoring the real exports for whatever file runs next. The snapshot is
 * also handed to the factory, so a partial stub can spread the real module instead of importing
 * it a second time itself — and, because the snapshot is taken before the stub is installed,
 * spreading it cannot recurse into the stub.
 *
 * Call it at module scope with `await`, in place of `mock.module`, before the file's tests are
 * registered. Only usable for specifiers that actually resolve — a stub for a module that does
 * not exist in this repo (`@vercel/functions`, `@/libs/posthog`) has nothing to snapshot, and
 * nothing real to leak in front of, so those keep using `mock.module` directly.
 */
export async function mockModuleForSuite<T extends Record<string, unknown>>(
  path: string,
  factory: (actual: T) => Record<string, unknown>
): Promise<void> {
  const actual = { ...(await import(path)) } as T;
  mock.module(path, () => factory(actual));
  afterAll(() => {
    mock.module(path, () => actual);
  });
}
