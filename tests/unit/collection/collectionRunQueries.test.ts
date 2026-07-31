import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';

import {
  claimCollectionRunItemRowsForPrompt,
  cancelPendingCollectionRunItemRows,
  countCollectionRunItemRowsByStatus,
  finishCollectionRunItemRow,
  getNextPendingPromptGroupForRun,
  insertCollectionRunItemRows,
  resetFailedCollectionRunItemRows,
  resetRunningCollectionRunItemRows,
} from '@/libs/database/CollectionRunItems/queries';
import {
  claimCollectionRunRow,
  finishCollectionRunRow,
  getCollectionRunRowWithId,
  getOldestPendingCollectionRunRow,
  insertCollectionRunRow,
  refreshCollectionRunCounters,
  reopenCollectionRunRow,
  resetRunningCollectionRunRows,
  setCollectionRunItemsTotal,
} from '@/libs/database/CollectionRuns/queries';
import { getDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { deletePromptResponseRowsWithRunIdAndPromptId } from '@/libs/database/PromptResponses/queries';
import {
  collectionRuns,
  projects,
  promptResponses,
  prompts,
  sources,
  topics,
} from '@/libs/database/schema';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import { cleanupTempDbPath, closeDatabase, createTempDbPath } from '../database/testHelpers';

// This suite calls the app-wide memoised getDatabase() (see libs/database/client.ts) because the
// query modules under test always go through it. Colliding with tests/unit/database/settings.test.ts
// — the only other suite that calls getDatabase() — is avoided because getDatabase() is now keyed
// on ALLSEARCH_DB_PATH, and tests/setup.ts defaults that env var so a stray call from any other
// suite can never fall through to the user's real database.
let dbPath: string;
let db: AllSearchDatabase;

beforeAll(async () => {
  dbPath = createTempDbPath('collection');
  process.env.ALLSEARCH_DB_PATH = dbPath;
  db = await getDatabase();
  await migrateDatabase(db, dbPath);
});

afterAll(() => {
  delete process.env.ALLSEARCH_DB_PATH;
  closeDatabase(db);
  cleanupTempDbPath(dbPath);
});

beforeEach(async () => {
  // Children cascade away with their Project (see cascade.test.ts), so clearing projects clears
  // everything below it including collection_runs' dependents.
  await db.delete(projects);
  await db.delete(collectionRuns);
});

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
  return { project, topic, prompt };
}

describe('CollectionRuns queries', () => {
  it('inserts a pending run and reads it back by id', async () => {
    const run = await insertCollectionRunRow({
      status: 'pending',
      started_at: null,
      finished_at: null,
      items_total: 0,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });

    expect(run.status).toBe('pending');
    expect(await getCollectionRunRowWithId(run.id)).toEqual(run);
  });

  it('returns the oldest pending run first', async () => {
    const older = await insertCollectionRunRow({
      status: 'pending',
      started_at: null,
      finished_at: null,
      items_total: 0,
      items_completed: 0,
      items_failed: 0,
      error: null,
      created_at: '2026-01-01T00:00:00.000Z',
    });
    await insertCollectionRunRow({
      status: 'pending',
      started_at: null,
      finished_at: null,
      items_total: 0,
      items_completed: 0,
      items_failed: 0,
      error: null,
      created_at: '2026-01-02T00:00:00.000Z',
    });

    expect((await getOldestPendingCollectionRunRow())?.id).toBe(older.id);
  });

  it('claims a pending run once, then reports undefined for a second claim', async () => {
    const run = await insertCollectionRunRow({
      status: 'pending',
      started_at: null,
      finished_at: null,
      items_total: 0,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });

    const claimed = await claimCollectionRunRow(run.id);
    expect(claimed?.status).toBe('running');
    expect(claimed?.started_at).not.toBeNull();

    expect(await claimCollectionRunRow(run.id)).toBeUndefined();
  });

  it('finishes a run with a status and optional error', async () => {
    const run = await insertCollectionRunRow({
      status: 'running',
      started_at: new Date().toISOString(),
      finished_at: null,
      items_total: 0,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });

    const finished = await finishCollectionRunRow(run.id, 'failed', 'boom');
    expect(finished.status).toBe('failed');
    expect(finished.error).toBe('boom');
    expect(finished.finished_at).not.toBeNull();
  });

  it('reopens a terminal run back to pending, clearing timing fields', async () => {
    const run = await insertCollectionRunRow({
      status: 'failed',
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      items_total: 3,
      items_completed: 1,
      items_failed: 2,
      error: 'boom',
    });

    const reopened = await reopenCollectionRunRow(run.id);
    expect(reopened.status).toBe('pending');
    expect(reopened.started_at).toBeNull();
    expect(reopened.finished_at).toBeNull();
    expect(reopened.error).toBeNull();
    // items_total is untouched by reopen — retry never changes it.
    expect(reopened.items_total).toBe(3);
  });

  it('resets running runs back to pending on boot recovery', async () => {
    const run = await insertCollectionRunRow({
      status: 'running',
      started_at: new Date().toISOString(),
      finished_at: null,
      items_total: 0,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });

    const reset = await resetRunningCollectionRunRows();
    expect(reset.map((row) => row.id)).toEqual([run.id]);
    expect((await getCollectionRunRowWithId(run.id))?.status).toBe('pending');
  });

  it('sets items_total', async () => {
    const run = await insertCollectionRunRow({
      status: 'pending',
      started_at: null,
      finished_at: null,
      items_total: 0,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });

    const updated = await setCollectionRunItemsTotal(run.id, 12);
    expect(updated.items_total).toBe(12);
  });

  it('recomputes items_completed and items_failed from the item rows', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const run = await insertCollectionRunRow({
      status: 'running',
      started_at: new Date().toISOString(),
      finished_at: null,
      items_total: 3,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });

    await insertCollectionRunItemRows([
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.ChatGPT, 'completed'),
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.Perplexity, 'failed'),
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.GoogleAIOverview, 'pending'),
    ]);

    await refreshCollectionRunCounters(run.id);

    const refreshed = await getCollectionRunRowWithId(run.id);
    expect(refreshed?.items_completed).toBe(1);
    expect(refreshed?.items_failed).toBe(1);
  });
});

function makeItemInput(
  runId: string,
  projectId: string,
  promptId: string,
  chatbotId: ChatbotId,
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' = 'pending'
) {
  return {
    run_id: runId,
    project_id: projectId,
    prompt_id: promptId,
    chatbot_id: chatbotId,
    status,
    attempts: 0,
    error: null,
    started_at: null,
    finished_at: null,
  };
}

describe('CollectionRunItems queries', () => {
  it('batch-inserts item rows', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const run = await insertCollectionRunRow({
      status: 'pending',
      started_at: null,
      finished_at: null,
      items_total: 2,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });

    const inserted = await insertCollectionRunItemRows([
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.ChatGPT),
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.Perplexity),
    ]);

    expect(inserted).toHaveLength(2);
    expect(inserted.every((row) => row.status === 'pending')).toBe(true);
  });

  it('groups the pending items of the earliest-created prompt, with its name', async () => {
    const { project, prompt: promptA } = await createProjectAndPrompt();
    const [topicB] = await db
      .insert(topics)
      .values({ name: 'Topic B', project_id: project.id })
      .returning();
    const [promptB] = await db
      .insert(prompts)
      .values({ name: 'Prompt B', topic_id: topicB.id, project_id: project.id })
      .returning();

    const run = await insertCollectionRunRow({
      status: 'pending',
      started_at: null,
      finished_at: null,
      items_total: 4,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });

    await insertCollectionRunItemRows([
      {
        ...makeItemInput(run.id, project.id, promptA.id, ChatbotId.ChatGPT),
        created_at: '2026-01-01T00:00:00.000Z',
      },
      {
        ...makeItemInput(run.id, project.id, promptA.id, ChatbotId.Perplexity),
        created_at: '2026-01-01T00:00:00.000Z',
      },
      {
        ...makeItemInput(run.id, project.id, promptB.id, ChatbotId.ChatGPT),
        created_at: '2026-01-02T00:00:00.000Z',
      },
    ]);

    const group = await getNextPendingPromptGroupForRun(run.id);
    expect(group?.promptId).toBe(promptA.id);
    expect(group?.promptName).toBe('Prompt');
    expect(group?.projectId).toBe(project.id);
    expect(group?.chatbotIds.sort()).toEqual([ChatbotId.ChatGPT, ChatbotId.Perplexity].sort());
  });

  it('returns undefined once no pending items remain', async () => {
    const run = await insertCollectionRunRow({
      status: 'pending',
      started_at: null,
      finished_at: null,
      items_total: 0,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });

    expect(await getNextPendingPromptGroupForRun(run.id)).toBeUndefined();
  });

  it('claims a prompt group once, then returns [] for an already-claimed group', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const run = await insertCollectionRunRow({
      status: 'pending',
      started_at: null,
      finished_at: null,
      items_total: 2,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });
    await insertCollectionRunItemRows([
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.ChatGPT),
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.Perplexity),
    ]);

    const claimed = await claimCollectionRunItemRowsForPrompt(run.id, prompt.id, [
      ChatbotId.ChatGPT,
      ChatbotId.Perplexity,
    ]);
    expect(claimed).toHaveLength(2);
    expect(claimed.every((row) => row.status === 'running')).toBe(true);

    const secondClaim = await claimCollectionRunItemRowsForPrompt(run.id, prompt.id, [
      ChatbotId.ChatGPT,
      ChatbotId.Perplexity,
    ]);
    expect(secondClaim).toEqual([]);
  });

  it('finishes an item row with status, error and accumulated attempts', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const run = await insertCollectionRunRow({
      status: 'running',
      started_at: new Date().toISOString(),
      finished_at: null,
      items_total: 1,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });
    const [item] = await insertCollectionRunItemRows([
      {
        ...makeItemInput(run.id, project.id, prompt.id, ChatbotId.ChatGPT, 'running'),
        attempts: 1,
      },
    ]);

    const finished = await finishCollectionRunItemRow(item.id, {
      status: 'failed',
      error: 'rate limited',
      attemptsUsed: 2,
    });

    expect(finished.status).toBe('failed');
    expect(finished.error).toBe('rate limited');
    expect(finished.attempts).toBe(3);
    expect(finished.finished_at).not.toBeNull();
  });

  it('resets running items back to pending on boot recovery', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const run = await insertCollectionRunRow({
      status: 'running',
      started_at: new Date().toISOString(),
      finished_at: null,
      items_total: 1,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });
    const [item] = await insertCollectionRunItemRows([
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.ChatGPT, 'running'),
    ]);

    const reset = await resetRunningCollectionRunItemRows();
    expect(reset.map((row) => row.id)).toContain(item.id);
    expect(reset.find((row) => row.id === item.id)?.status).toBe('pending');
  });

  it('resets failed items of a run back to pending, clearing error and timing', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const run = await insertCollectionRunRow({
      status: 'running',
      started_at: new Date().toISOString(),
      finished_at: null,
      items_total: 1,
      items_completed: 0,
      items_failed: 1,
      error: null,
    });
    const [item] = await insertCollectionRunItemRows([
      {
        ...makeItemInput(run.id, project.id, prompt.id, ChatbotId.ChatGPT, 'failed'),
        attempts: 3,
        error: 'boom',
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      },
    ]);

    const reset = await resetFailedCollectionRunItemRows(run.id);
    expect(reset).toHaveLength(1);
    expect(reset[0].status).toBe('pending');
    expect(reset[0].error).toBeNull();
    expect(reset[0].started_at).toBeNull();
    expect(reset[0].finished_at).toBeNull();
    // attempts is kept so retries accumulate honestly.
    expect(reset[0].attempts).toBe(3);
    expect(item.id).toBe(reset[0].id);
  });

  it('cancels only pending items of a run, leaving running items alone', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const run = await insertCollectionRunRow({
      status: 'running',
      started_at: new Date().toISOString(),
      finished_at: null,
      items_total: 2,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });
    const [pendingItem, runningItem] = await insertCollectionRunItemRows([
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.ChatGPT, 'pending'),
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.Perplexity, 'running'),
    ]);

    const cancelled = await cancelPendingCollectionRunItemRows(run.id);
    expect(cancelled.map((row) => row.id)).toEqual([pendingItem.id]);

    const counts = await countCollectionRunItemRowsByStatus(run.id);
    expect(counts.cancelled).toBe(1);
    expect(counts.running).toBe(1);
    expect(runningItem.status).toBe('running');
  });

  it('counts items by status', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const run = await insertCollectionRunRow({
      status: 'running',
      started_at: new Date().toISOString(),
      finished_at: null,
      items_total: 3,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });
    await insertCollectionRunItemRows([
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.ChatGPT, 'completed'),
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.Perplexity, 'failed'),
      makeItemInput(run.id, project.id, prompt.id, ChatbotId.GoogleAIOverview, 'pending'),
    ]);

    expect(await countCollectionRunItemRowsByStatus(run.id)).toEqual({
      pending: 1,
      running: 0,
      completed: 1,
      failed: 1,
      cancelled: 0,
    });
  });
});

describe('deletePromptResponseRowsWithRunIdAndPromptId', () => {
  it('deletes the matching prompt responses and their sources, leaving a sibling chatbot untouched', async () => {
    const { project, prompt } = await createProjectAndPrompt();
    const run = await insertCollectionRunRow({
      status: 'running',
      started_at: new Date().toISOString(),
      finished_at: null,
      items_total: 2,
      items_completed: 0,
      items_failed: 0,
      error: null,
    });

    const [targetResponse, siblingResponse] = await db
      .insert(promptResponses)
      .values([
        {
          text: 'ChatGPT answer',
          chatbot_id: ChatbotId.ChatGPT,
          prompt_id: prompt.id,
          project_id: project.id,
          workflow_id: run.id,
          model_id: 'gpt',
          run_id: run.id,
        },
        {
          text: 'Perplexity answer',
          chatbot_id: ChatbotId.Perplexity,
          prompt_id: prompt.id,
          project_id: project.id,
          workflow_id: run.id,
          model_id: 'pplx',
          run_id: run.id,
        },
      ])
      .returning();

    await db.insert(sources).values([
      {
        project_id: project.id,
        prompt_id: prompt.id,
        prompt_response_id: targetResponse.id,
        is_cited: true,
        position: 1,
        clean_url: 'example.com/target',
        url: 'https://example.com/target',
        hostname: 'example.com',
      },
      {
        project_id: project.id,
        prompt_id: prompt.id,
        prompt_response_id: siblingResponse.id,
        is_cited: true,
        position: 1,
        clean_url: 'example.com/sibling',
        url: 'https://example.com/sibling',
        hostname: 'example.com',
      },
    ]);

    const deleted = await deletePromptResponseRowsWithRunIdAndPromptId(run.id, prompt.id, [
      ChatbotId.ChatGPT,
    ]);

    expect(deleted.map((row) => row.id)).toEqual([targetResponse.id]);
    expect(
      await db.select().from(promptResponses).where(eq(promptResponses.id, targetResponse.id))
    ).toEqual([]);
    expect(
      await db.select().from(sources).where(eq(sources.prompt_response_id, targetResponse.id))
    ).toEqual([]);

    // The sibling Chatbot's response and its source survive untouched.
    expect(
      await db.select().from(promptResponses).where(eq(promptResponses.id, siblingResponse.id))
    ).toHaveLength(1);
    expect(
      await db.select().from(sources).where(eq(sources.prompt_response_id, siblingResponse.id))
    ).toHaveLength(1);
  });

  it('returns [] when given no chatbot ids', async () => {
    expect(await deletePromptResponseRowsWithRunIdAndPromptId('run-1', 'prompt-1', [])).toEqual([]);
  });
});
