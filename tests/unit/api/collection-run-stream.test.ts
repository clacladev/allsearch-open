import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';

import { GET as getStream } from '@/app/api/collection-runs/[runId]/stream/route';
import { getDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { recomputeCollectionRunCounters } from '@/libs/database/CollectionRuns/queries';
import { collectionRunItems, collectionRuns, projects, prompts, topics } from '@/libs/database/schema';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import { cleanupTempDbPath, closeDatabase, createTempDbPath } from '../database/testHelpers';

// Direct handler invocation against a real, migrated temp SQLite DB — same pattern as
// tests/unit/api/process-prompts.test.ts. No mock.module calls here: the stream route only reads
// through libs/collection/getCollectionRunProgress.ts, which is plain DB reads, so there is
// nothing to fake.
let dbPath: string;
let db: AllSearchDatabase;

beforeAll(async () => {
  dbPath = createTempDbPath('collectionRunStream');
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

async function createProjectAndPrompt(name = 'Prompt') {
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
    .values({ name, topic_id: topic.id, project_id: project.id })
    .returning();
  return { project, prompt };
}

async function createRunWithItems(
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
  itemStatuses: ('pending' | 'running' | 'completed' | 'failed' | 'cancelled')[]
) {
  const { project, prompt } = await createProjectAndPrompt();
  const runId = crypto.randomUUID();
  await db.insert(collectionRuns).values({
    id: runId,
    status,
    started_at: status === 'pending' ? null : new Date().toISOString(),
    finished_at: ['completed', 'failed', 'cancelled'].includes(status)
      ? new Date().toISOString()
      : null,
    items_total: itemStatuses.length,
    items_completed: itemStatuses.filter((s) => s === 'completed').length,
    items_failed: itemStatuses.filter((s) => s === 'failed').length,
    error: null,
  });
  const chatbotIds = [ChatbotId.ChatGPT, ChatbotId.Perplexity, ChatbotId.GoogleAIOverview];
  const items = await db
    .insert(collectionRunItems)
    .values(
      itemStatuses.map((itemStatus, index) => ({
        run_id: runId,
        project_id: project.id,
        prompt_id: prompt.id,
        chatbot_id: chatbotIds[index % chatbotIds.length],
        status: itemStatus,
        attempts: 0,
        error: null,
        started_at: null,
        finished_at: null,
      }))
    )
    .returning();
  return { runId, project, prompt, items };
}

/** Minimal SSE frame reader over a ReadableStream<Uint8Array>, buffering across chunk boundaries
 * so a test can pull one `{ event, data }` frame at a time regardless of how the underlying stream
 * happened to chunk its writes. */
function createSseFrameReader(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  async function nextFrame(): Promise<{ event: string; data: unknown } | undefined> {
    while (true) {
      const frameEnd = buffer.indexOf('\n\n');
      if (frameEnd !== -1) {
        const rawFrame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        if (rawFrame.startsWith(':')) continue; // heartbeat comment, keep reading
        if (rawFrame.startsWith('retry:')) continue; // retry hint, not a data frame
        const eventLine = rawFrame.split('\n').find((line) => line.startsWith('event: '));
        const dataLine = rawFrame.split('\n').find((line) => line.startsWith('data: '));
        if (!eventLine || !dataLine) continue;
        return {
          event: eventLine.slice('event: '.length),
          data: JSON.parse(dataLine.slice('data: '.length)),
        };
      }
      const { value, done } = await reader.read();
      if (done) return undefined;
      buffer += decoder.decode(value, { stream: true });
    }
  }

  return { nextFrame, reader };
}

describe('GET /api/collection-runs/[runId]/stream', () => {
  it('returns 404 JSON for an unknown runId', async () => {
    const req = new NextRequest('http://localhost/api/collection-runs/does-not-exist/stream');
    const res = await getStream(req, makeParams('does-not-exist'));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('streams retry + one progress frame + a final done frame for a terminal Run, then completes on its own', async () => {
    // Two Prompts under the same Project: one whose items are all `completed`, one whose items are
    // all `failed` — so the Prompt-level derivation (a Prompt only reads as `failed` once every
    // item is) yields exactly one covered and one failed Prompt.
    const { project: projectA, prompt: promptA } = await createProjectAndPrompt('Prompt A');
    const [topicB] = await db
      .insert(topics)
      .values({ name: 'Topic B', project_id: projectA.id })
      .returning();
    const [promptB] = await db
      .insert(prompts)
      .values({ name: 'Prompt B', topic_id: topicB.id, project_id: projectA.id })
      .returning();
    const runId = crypto.randomUUID();
    await db.insert(collectionRuns).values({
      id: runId,
      status: 'completed',
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      items_total: 2,
      items_completed: 1,
      items_failed: 1,
      error: null,
    });
    await db.insert(collectionRunItems).values([
      {
        run_id: runId,
        project_id: projectA.id,
        prompt_id: promptA.id,
        chatbot_id: ChatbotId.ChatGPT,
        status: 'completed',
        attempts: 0,
        error: null,
        started_at: null,
        finished_at: new Date().toISOString(),
      },
      {
        run_id: runId,
        project_id: projectA.id,
        prompt_id: promptB.id,
        chatbot_id: ChatbotId.ChatGPT,
        status: 'failed',
        attempts: 3,
        error: 'boom',
        started_at: null,
        finished_at: new Date().toISOString(),
      },
    ]);

    const req = new NextRequest(`http://localhost/api/collection-runs/${runId}/stream`);
    const res = await getStream(req, makeParams(runId));

    expect(res.headers.get('Content-Type')).toBe('text/event-stream; charset=utf-8');
    expect(res.body).toBeTruthy();

    const text = await new Response(res.body).text();
    expect(text).toContain('retry: 3000');

    const progressCount = (text.match(/event: progress/g) ?? []).length;
    expect(progressCount).toBe(1);
    expect(text).toContain('event: done');

    const doneFrameMatch = text.match(/event: done\ndata: (.+)\n\n/);
    expect(doneFrameMatch).toBeTruthy();
    const donePayload = JSON.parse(doneFrameMatch![1]);
    expect(donePayload.isTerminal).toBe(true);
    expect(donePayload.promptsTotal).toBe(2);
    expect(donePayload.promptsCompleted).toBe(1);
    expect(donePayload.promptsFailed).toBe(1);
  });

  it('emits a second progress frame once the Run changes, reflecting the change', async () => {
    const { runId, items } = await createRunWithItems('running', ['running', 'pending']);

    const req = new NextRequest(`http://localhost/api/collection-runs/${runId}/stream`);
    const res = await getStream(req, makeParams(runId));
    expect(res.body).toBeTruthy();

    const { nextFrame } = createSseFrameReader(res.body!);

    const first = await nextFrame();
    expect(first?.event).toBe('progress');

    // Flip the running item to completed and recompute counters — the same write shape
    // executePrompt.ts uses — while the stream's 1s poll loop is running.
    await db
      .update(collectionRunItems)
      .set({ status: 'completed', finished_at: new Date().toISOString() })
      .where(eq(collectionRunItems.id, items[0].id));
    await recomputeCollectionRunCounters(runId);

    const second = await nextFrame();
    expect(second?.event).toBe('progress');
    const secondData = second?.data as {
      promptsCompleted: number;
      projects: { prompts: { chatbots: { chatbotId: string; status: string }[] }[] }[];
    };
    // Both items belong to the same Prompt; the Prompt only reads as covered once every item is
    // no longer pending/running, so promptsCompleted is still 0 with one item left pending — but
    // the flipped item itself must show up as `completed` in the snapshot, otherwise a duplicated
    // stale frame (same promptsCompleted, same everything) would pass this test too.
    expect(secondData.promptsCompleted).toBe(0);
    const flippedChatbot = secondData.projects[0].prompts[0].chatbots.find(
      (chatbot) => chatbot.chatbotId === ChatbotId.ChatGPT
    );
    expect(flippedChatbot?.status).toBe('completed');
  }, 6_000);

  it('emits a `done` frame and closes once the Run turns terminal while the stream is open', async () => {
    // The production path: the stream starts on a non-terminal Run (so it enters the poll loop
    // instead of the early-return branch at the top of the handler) and only becomes terminal on a
    // later poll, while the connection is still open — as opposed to the earlier "terminal Run"
    // test, which only exercises the early-return branch for a Run that was already finished when
    // the stream started.
    const { runId, items } = await createRunWithItems('running', ['running']);

    const req = new NextRequest(`http://localhost/api/collection-runs/${runId}/stream`);
    const res = await getStream(req, makeParams(runId));
    expect(res.body).toBeTruthy();

    const { nextFrame, reader } = createSseFrameReader(res.body!);

    const first = await nextFrame();
    expect(first?.event).toBe('progress');

    await db
      .update(collectionRunItems)
      .set({ status: 'completed', finished_at: new Date().toISOString() })
      .where(eq(collectionRunItems.id, items[0].id));
    await db
      .update(collectionRuns)
      .set({ status: 'completed', finished_at: new Date().toISOString() })
      .where(eq(collectionRuns.id, runId));
    await recomputeCollectionRunCounters(runId);

    // The poll that observes the terminal Run first sends a `progress` frame (the snapshot
    // changed) and then, in the same iteration, the terminal `done` frame — see the route's
    // `if (progress.isTerminal)` check right after its snapshot-diff `send('progress', ...)`.
    const second = await nextFrame();
    expect(second?.event).toBe('progress');

    const done = await nextFrame();
    expect(done?.event).toBe('done');
    const doneData = done?.data as { isTerminal: boolean; status: string };
    expect(doneData.isTerminal).toBe(true);
    expect(doneData.status).toBe('completed');

    const finalRead = await reader.read();
    expect(finalRead.done).toBe(true);
  }, 6_000);

  it('ends the stream on client disconnect rather than hanging', async () => {
    const { runId } = await createRunWithItems('running', ['pending']);

    const controller = new AbortController();
    const req = new NextRequest(`http://localhost/api/collection-runs/${runId}/stream`, {
      signal: controller.signal,
    });
    const res = await getStream(req, makeParams(runId));
    expect(res.body).toBeTruthy();

    const { nextFrame, reader } = createSseFrameReader(res.body!);
    const first = await nextFrame();
    expect(first?.event).toBe('progress');

    controller.abort();

    const finalRead = await reader.read();
    expect(finalRead.done).toBe(true);
  }, 6_000);
});
