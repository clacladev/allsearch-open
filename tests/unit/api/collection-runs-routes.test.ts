import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';

// This suite drives the real `cancelCollectionRun` engine function against a real, migrated temp
// SQLite DB — no `mock.module` stubbing of `@/libs/collection`, per the module-mock warning at the
// top of tests/unit/api/process-prompts.test.ts (Bun's `mock.module` is process-wide and would leak
// into every later suite).
import { GET as getActive } from '@/app/api/collection-runs/active/route';
import { POST as postCancel } from '@/app/api/collection-runs/[runId]/cancel/route';
import { NextRequest } from 'next/server';
import { getDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
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
