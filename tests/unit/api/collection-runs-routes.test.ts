import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';

// This suite drives the real `cancelCollectionRun` engine function against a real, migrated temp
// SQLite DB — no `mock.module` stubbing of `@/libs/collection`, per the module-mock warning at the
// top of tests/unit/api/process-prompts.test.ts (Bun's `mock.module` is process-wide and would leak
// into every later suite).
import { GET as getActive } from '@/app/api/collection-runs/active/route';
import { GET as getCadence } from '@/app/api/collection-runs/cadence/route';
import { POST as postCancel } from '@/app/api/collection-runs/[runId]/cancel/route';
import { POST as postRetry } from '@/app/api/collection-runs/[runId]/retry/route';
import { NextRequest } from 'next/server';
import { getDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { waitForCollectionRunLoop } from '@/libs/collection/runLoop';
import { collectionRunItems, collectionRuns, projects, prompts, topics } from '@/libs/database/schema';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import { cleanupTempDbPath, closeDatabase, createTempDbPath } from '../database/testHelpers';

let dbPath: string;
let db: AllSearchDatabase;

beforeAll(async () => {
  dbPath = createTempDbPath('collectionRunsRoutes');
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

function makeParams(runId: string) {
  return { params: Promise.resolve({ runId }) };
}

async function createProjectAndPrompt() {
  const [project] = await db
    .insert(projects)
    .values({ url: 'https://example.com', name: 'Example', aliases: [] })
    .returning();
  const [topic] = await db
    .insert(topics)
    .values({ name: 'Topic', project_id: project.id })
    .returning();
  const [prompt] = await db
    .insert(prompts)
    .values({ name: 'Prompt', topic_id: topic.id, project_id: project.id })
    .returning();
  return { project, prompt };
}

describe('GET /api/collection-runs/active', () => {
  it('returns { runId: null } when there are no Runs', async () => {
    const res = await getActive();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ runId: null });
  });

  it("returns the active Run's id when one is pending/running", async () => {
    const [run] = await db
      .insert(collectionRuns)
      .values({
        status: 'pending',
        started_at: null,
        finished_at: null,
        items_total: 0,
        items_completed: 0,
        items_failed: 0,
        error: null,
      })
      .returning();

    const res = await getActive();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ runId: run.id });
  });

  it('returns null again once the Run is cancelled', async () => {
    const [run] = await db
      .insert(collectionRuns)
      .values({
        status: 'pending',
        started_at: null,
        finished_at: null,
        items_total: 0,
        items_completed: 0,
        items_failed: 0,
        error: null,
      })
      .returning();

    await db
      .update(collectionRuns)
      .set({ status: 'cancelled', finished_at: new Date().toISOString() })
      .where(eq(collectionRuns.id, run.id));

    const res = await getActive();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ runId: null });
  });
});

describe('POST /api/collection-runs/[runId]/cancel', () => {
  it('cancels a pending Run and its pending items', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const [run] = await db
      .insert(collectionRuns)
      .values({
        status: 'pending',
        started_at: null,
        finished_at: null,
        items_total: 2,
        items_completed: 0,
        items_failed: 0,
        error: null,
      })
      .returning();
    await db.insert(collectionRunItems).values([
      {
        run_id: run.id,
        project_id: project.id,
        prompt_id: prompt.id,
        chatbot_id: ChatbotId.ChatGPT,
        status: 'pending',
        attempts: 0,
        error: null,
        started_at: null,
        finished_at: null,
      },
      {
        run_id: run.id,
        project_id: project.id,
        prompt_id: prompt.id,
        chatbot_id: ChatbotId.Perplexity,
        status: 'pending',
        attempts: 0,
        error: null,
        started_at: null,
        finished_at: null,
      },
    ]);

    const req = new NextRequest(`http://localhost/api/collection-runs/${run.id}/cancel`, {
      method: 'POST',
    });
    const res = await postCancel(req, makeParams(run.id));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ runId: run.id, status: 'cancelled' });

    const [refreshedRun] = await db
      .select()
      .from(collectionRuns)
      .where(eq(collectionRuns.id, run.id));
    expect(refreshedRun.status).toBe('cancelled');

    const items = await db
      .select()
      .from(collectionRunItems)
      .where(eq(collectionRunItems.run_id, run.id));
    expect(items.every((item) => item.status === 'cancelled')).toBe(true);
  });

  it('returns 404 JSON for an unknown runId, matching the stream and report routes', async () => {
    const req = new NextRequest('http://localhost/api/collection-runs/does-not-exist/cancel', {
      method: 'POST',
    });
    const res = await postCancel(req, makeParams('does-not-exist'));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});

describe('GET /api/collection-runs/cadence', () => {
  it('returns null anchor and null failedRun on an empty DB', async () => {
    const res = await getCadence();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ lastCompletedRunFinishedAt: null, failedRun: null });
  });

  it('anchors on the completed scope=all run', async () => {
    await db.insert(collectionRuns).values({
      status: 'completed',
      scope: 'all',
      started_at: null,
      finished_at: '2026-01-01T00:00:00.000Z',
      items_total: 0,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });

    const res = await getCadence();
    const body = await res.json();
    expect(body.lastCompletedRunFinishedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('reports the distinct failed-Prompt count on the latest terminal run', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const [run] = await db
      .insert(collectionRuns)
      .values({
        status: 'completed',
        scope: 'all',
        started_at: null,
        finished_at: '2026-01-01T00:00:00.000Z',
        items_total: 3,
        items_completed: 0,
        items_failed: 3,
        error: null,
      })
      .returning();
    await db.insert(collectionRunItems).values([
      {
        run_id: run.id,
        project_id: project.id,
        prompt_id: prompt.id,
        chatbot_id: ChatbotId.ChatGPT,
        status: 'failed',
        attempts: 3,
        error: 'boom',
        started_at: null,
        finished_at: null,
      },
      {
        run_id: run.id,
        project_id: project.id,
        prompt_id: prompt.id,
        chatbot_id: ChatbotId.Perplexity,
        status: 'failed',
        attempts: 3,
        error: 'boom',
        started_at: null,
        finished_at: null,
      },
      {
        run_id: run.id,
        project_id: project.id,
        prompt_id: prompt.id,
        chatbot_id: ChatbotId.GoogleAIOverview,
        status: 'failed',
        attempts: 3,
        error: 'boom',
        started_at: null,
        finished_at: null,
      },
    ]);

    const res = await getCadence();
    const body = await res.json();
    expect(body.failedRun).toEqual({ runId: run.id, failedPromptCount: 1 });
  });

  it('reports failedRun as null when the latest terminal run has no failed items', async () => {
    await db.insert(collectionRuns).values({
      status: 'completed',
      scope: 'all',
      started_at: null,
      finished_at: '2026-01-01T00:00:00.000Z',
      items_total: 1,
      items_completed: 1,
      items_failed: 0,
      error: null,
    });

    const res = await getCadence();
    const body = await res.json();
    expect(body.failedRun).toBeNull();
  });
});

describe('POST /api/collection-runs/[runId]/retry', () => {
  it('returns 404 for an unknown runId', async () => {
    const req = new NextRequest('http://localhost/api/collection-runs/does-not-exist/retry', {
      method: 'POST',
    });
    const res = await postRetry(req, makeParams('does-not-exist'));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('resets a completed Run with failed items back to pending and returns 200', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const [run] = await db
      .insert(collectionRuns)
      .values({
        status: 'completed',
        scope: 'all',
        started_at: null,
        finished_at: new Date().toISOString(),
        items_total: 1,
        items_completed: 0,
        items_failed: 1,
        error: null,
      })
      .returning();
    await db.insert(collectionRunItems).values({
      run_id: run.id,
      project_id: project.id,
      prompt_id: prompt.id,
      chatbot_id: ChatbotId.ChatGPT,
      status: 'failed',
      attempts: 3,
      error: 'boom',
      started_at: null,
      finished_at: null,
    });

    const req = new NextRequest(`http://localhost/api/collection-runs/${run.id}/retry`, {
      method: 'POST',
    });
    const res = await postRetry(req, makeParams(run.id));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ runId: run.id, status: 'pending' });

    // Drains the run before afterEach cleans up (no provider keys configured, so every item fails
    // immediately with no retry and no network call — see MissingProviderKeyError).
    await waitForCollectionRunLoop();
  });
});
