import { mock } from 'bun:test';

// This suite's subject is the routes' wiring — which engine call they make and what they
// return. Prompt selection is not part of that, and tests/unit/collection/collectionRun.test.ts
// already exercises it for real. Declare it explicitly rather than inheriting whatever
// `Prompts/queries` mock happens to be live: Bun's `mock.module` is process-wide, and other
// suites replace this module without restoring it. Returning no Prompts means each run
// materialises zero items, finalises `completed` immediately, and no AI call is ever made — this
// is what keeps the suite free of provider spend.
mock.module('@/libs/database/Prompts/queries', () => ({
  getPromptRowsWithProjectId: async () => [],
}));

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { POST as postOneProject } from '@/app/api/process-prompts/[projectId]/route';
import { POST as postAllProjects } from '@/app/api/process-prompts/route';
import { getDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { collectionRuns, projects } from '@/libs/database/schema';
import { cleanupTempDbPath, closeDatabase, createTempDbPath } from '../database/testHelpers';

// Real temp SQLite, keyed on ALLSEARCH_DB_PATH (libs/database/client.ts) so this suite's
// getDatabase() calls don't collide with tests/unit/database/settings.test.ts, the only other
// suite allowed to call the memoised getDatabase() directly.
let dbPath: string;
let db: AllSearchDatabase;

beforeAll(async () => {
  dbPath = createTempDbPath('processPromptsRoute');
  process.env.ALLSEARCH_DB_PATH = dbPath;
  db = await getDatabase();
  await migrateDatabase(db, dbPath);
});

afterAll(() => {
  delete process.env.ALLSEARCH_DB_PATH;
  closeDatabase(db);
  cleanupTempDbPath(dbPath);
});

afterEach(async () => {
  await db.delete(projects);
  await db.delete(collectionRuns);
});

function makeRequest(url: string) {
  const req = new Request(url, { method: 'POST' });
  Object.defineProperty(req, 'nextUrl', { value: new URL(url) });
  return req;
}

function makeParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

describe('POST /api/process-prompts/[projectId]', () => {
  it('returns 200 with a runId resolving to a real collection_runs row', async () => {
    const [project] = await db
      .insert(projects)
      .values({ url: 'https://example.com', name: 'Example', aliases: [] })
      .returning();

    // No topics/prompts for this project, so `createCollectionRun` materialises zero items and
    // finalises the run `completed` immediately — this test is about the route's wiring (which
    // engine call it makes and what it returns), not the worker loop itself, which
    // tests/unit/collection/collectionRun.test.ts already covers end to end.
    const res = await postOneProject(
      makeRequest(`http://localhost/api/process-prompts/${project.id}`) as never,
      makeParams(project.id)
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.runId).toBeTruthy();

    const [runRow] = await db
      .select()
      .from(collectionRuns)
      .where(eq(collectionRuns.id, body.runId));
    expect(runRow).toBeDefined();
    expect(runRow?.id).toBe(body.runId);
  });

  it('returns 400 when projectId is missing', async () => {
    const res = await postOneProject(
      makeRequest('http://localhost/api/process-prompts/') as never,
      makeParams('')
    );

    expect(res.status).toBe(400);
  });
});

describe('POST /api/process-prompts', () => {
  it('returns 200 with a runId resolving to a real collection_runs row', async () => {
    await db
      .insert(projects)
      .values({ url: 'https://example.com', name: 'Example', aliases: [] })
      .returning();

    const res = await postAllProjects();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.runId).toBeTruthy();

    const [runRow] = await db
      .select()
      .from(collectionRuns)
      .where(eq(collectionRuns.id, body.runId));
    expect(runRow).toBeDefined();
    expect(runRow?.id).toBe(body.runId);
  });
});

describe('POST /api/process-prompts/[projectId] — shouldForce wiring', () => {
  it('passes shouldForce through to createCollectionRun as a boolean, true only for ?shouldForce=true', async () => {
    // Stubs `@/libs/collection` itself (rather than the DB-backed Prompts mock the rest of this
    // file uses) so this test can assert exactly what `createCollectionRun` was called with,
    // instead of only what the route returns — the DB-backed assertions above can't tell forced
    // apart from unforced. Placed last in this file and never restored mid-file, so nothing else
    // here depends on the real `@/libs/collection`; the trailing `mock.restore()` below still
    // cleans this up before the next test file runs.
    const calls: unknown[] = [];
    mock.module('@/libs/collection', () => ({
      createCollectionRun: mock(async (input: unknown) => {
        calls.push(input);
        return { id: 'fake-run-id' };
      }),
      ensureCollectionRunLoopIsRunning: mock(() => {}),
    }));

    const forcedRes = await postOneProject(
      makeRequest('http://localhost/api/process-prompts/project-1?shouldForce=true') as never,
      makeParams('project-1')
    );
    expect(forcedRes.status).toBe(200);

    const unforcedRes = await postOneProject(
      makeRequest('http://localhost/api/process-prompts/project-1') as never,
      makeParams('project-1')
    );
    expect(unforcedRes.status).toBe(200);

    expect(calls).toEqual([
      { projectIds: ['project-1'], shouldForce: true },
      { projectIds: ['project-1'], shouldForce: false },
    ]);
  });
});

// `mock.module` is process-wide in Bun and does not undo itself when this file finishes — restore
// it so the real modules are visible to whatever test file runs next.
afterAll(() => {
  mock.restore();
});
