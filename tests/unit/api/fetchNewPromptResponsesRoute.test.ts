import { mock } from 'bun:test';

// Note: next/server is mocked globally in tests/setup.ts.

// The route dropped this import as part of issue 10 (issue 11 territory: the other five
// `start()` call sites are untouched). Mocking it here still guards against a regression that
// reintroduces it — `mockStart` must stay uncalled.
const mockStart = mock(async () => ({}));
mock.module('workflow/api', () => ({ start: mockStart }));

// This suite's subject is the route's wiring — which engine call it makes, what it returns, and
// that it no longer reaches for `start()`. Prompt selection is not part of that, and
// tests/unit/collection/collectionRun.test.ts already exercises it for real. Declare it
// explicitly rather than inheriting whatever `Prompts/queries` mock happens to be live: Bun's
// `mock.module` is process-wide, and two earlier suites replace this module without restoring it
// (one of them, tests/unit/workflows/fetchDailyPromptsForProjectSteps.test.ts, is pinned by issue
// 10 and cannot be changed). Returning no Prompts means the run materialises zero items.
mock.module('@/libs/database/Prompts/queries', () => ({
  getPromptRowsWithProjectId: async () => [],
}));

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { POST } from '@/app/api/project/[projectId]/fetch-new-prompt-responses/route';
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
  dbPath = createTempDbPath('fetchNewPromptResponsesRoute');
  process.env.ALLSEARCH_DB_PATH = dbPath;
  db = await getDatabase();
  await migrateDatabase(db, dbPath);
});

afterAll(() => {
  delete process.env.ALLSEARCH_DB_PATH;
  closeDatabase(db);
  cleanupTempDbPath(dbPath);
});

beforeEach(() => {
  mockStart.mockClear();
});

afterEach(async () => {
  await db.delete(projects);
  await db.delete(collectionRuns);
});

function makeRequest(projectId: string) {
  const url = `http://localhost/api/project/${projectId}/fetch-new-prompt-responses`;
  const req = new Request(url, { method: 'POST' });
  Object.defineProperty(req, 'nextUrl', { value: new URL(url) });
  return req;
}

function makeParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

describe('POST /api/project/[projectId]/fetch-new-prompt-responses', () => {
  it('returns 200 with a runId resolving to a real collection_runs row, and never calls start from workflow/api', async () => {
    const [project] = await db
      .insert(projects)
      .values({ url: 'https://example.com', name: 'Example', aliases: [] })
      .returning();

    // No topics/prompts for this project, so `createCollectionRun` materialises zero items and
    // finalises the run `completed` immediately — this test is about the route's wiring (which
    // engine call it makes and what it returns), not the worker loop itself, which
    // tests/unit/collection/collectionRun.test.ts already covers end to end.
    const res = await POST(makeRequest(project.id) as never, makeParams(project.id));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.runId).toBeTruthy();

    const [runRow] = await db
      .select()
      .from(collectionRuns)
      .where(eq(collectionRuns.id, body.runId));
    expect(runRow).toBeDefined();
    expect(runRow?.id).toBe(body.runId);

    expect(mockStart).not.toHaveBeenCalled();
  });

  it('returns 400 when projectId is missing', async () => {
    const res = await POST(makeRequest('') as never, makeParams(''));

    expect(res.status).toBe(400);
    expect(mockStart).not.toHaveBeenCalled();
  });
});

// `mock.module` is process-wide in Bun and does not undo itself when this file finishes — restore
// it so the real 'workflow/api' module is visible to whatever test file runs next.
afterAll(() => {
  mock.restore();
});
