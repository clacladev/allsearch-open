import { mock } from 'bun:test';

// This suite drives real POST requests against a real, migrated temp SQLite database (set up
// below) rather than stubbing `@/libs/collection` (the engine barrel). Bun's `mock.module` is
// process-wide and `mock.restore()` does NOT undo it (verified against Bun 1.3.14) — stubbing the
// barrel here would leak `createCollectionRun`/`ensureCollectionRunLoopIsRunning` fakes into every
// suite that imports the real engine for the rest of the test process (e.g.
// tests/unit/collection/collectionRun.test.ts). Only the AI-provider leaf modules are faked below,
// per the harness tests/unit/collection/collectionRun.test.ts and
// tests/unit/collection/executePrompt.test.ts also use, so this suite's real, DB-backed Runs can
// actually be driven to completion by the real Collection Run loop with no AI call ever made and
// no provider spend.
const mockChatGPT = mock(async () => ({
  response: { modelId: 'chatgpt-model' },
  text: 'chatgpt response',
  sources: [],
  toolResults: [],
}));
const mockGoogleAIMode = mock(async () => ({
  response: { modelId: 'google-model' },
  text: 'google response',
  sources: [],
  toolResults: [],
}));
const mockPerplexity = mock(async () => ({
  response: { modelId: 'perplexity-model' },
  text: 'perplexity response',
  sources: [],
  toolResults: [],
}));
const mockSentiment = mock(async () => ({}));
const mockSources = mock(async () => []);

mock.module('@/libs/ai/projectPrompt/getPromptResponseWithChatGPT', () => ({
  getPromptResponseWithChatGPT: mockChatGPT,
}));
mock.module('@/libs/ai/projectPrompt/getPromptResponseWithGoogleAIMode', () => ({
  getPromptResponseWithGoogleAIMode: mockGoogleAIMode,
}));
mock.module('@/libs/ai/projectPrompt/getPromptResponseWithPerplexity', () => ({
  getPromptResponseWithPerplexity: mockPerplexity,
}));
mock.module('@/libs/ai/sentimentAnalysis', () => ({
  analyzeResponseSentiment: mockSentiment,
}));
// Not an AI call, but hits the network (page crawling) if left real — faked per the harness so no
// page is fetched.
mock.module('@/libs/collection/analyseSources', () => ({
  analysePromptResponseSources: mockSources,
}));

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { POST as postOneProject } from '@/app/api/process-prompts/[projectId]/route';
import { POST as postAllProjects } from '@/app/api/process-prompts/route';
import { getDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { waitForCollectionRunLoop } from '@/libs/collection/runLoop';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import {
  collectionRunItems,
  collectionRuns,
  projects,
  promptResponses,
  prompts,
  settings,
  topics,
} from '@/libs/database/schema';
import { cleanupTempDbPath, closeDatabase, createTempDbPath } from '../database/testHelpers';

// Real temp SQLite, keyed on ALLSEARCH_DB_PATH (libs/database/client.ts) so each suite that calls
// getDatabase() directly (this file, tests/unit/database/settings.test.ts,
// tests/unit/collection/collectionRun.test.ts, tests/unit/collection/collectionRunQueries.test.ts)
// gets its own connection.
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
  // mock.module is process-wide in Bun: the AI-leaf mocks above stay registered for whatever file
  // runs next in this process; that file's own top-level mock.module calls (the same pattern this
  // file uses) are what actually take over.
});

afterEach(async () => {
  await db.delete(projects);
  await db.delete(collectionRuns);
  await db.delete(settings);
  mockChatGPT.mockClear();
  mockGoogleAIMode.mockClear();
  mockPerplexity.mockClear();
  mockSentiment.mockClear();
  mockSources.mockClear();
});

function makeRequest(url: string) {
  const req = new Request(url, { method: 'POST' });
  Object.defineProperty(req, 'nextUrl', { value: new URL(url) });
  return req;
}

function makeParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

// Writes provider keys straight to the `settings` table, bypassing `@/libs/database/Settings/queries`'s
// `setProviderKey` entirely: that module is a magnet for other suites' `mock.module` calls (e.g.
// tests/unit/api/settings-provider-keys-route.test.ts replaces the whole module and never restores
// it — Bun's `mock.module` is process-wide, per finding 2/the harness note above), and this file
// must not gamble on which of those happens to still be live when it runs.
async function setAllProviderKeys() {
  const validatedAt = new Date().toISOString();
  await db.insert(settings).values({
    id: 'singleton',
    provider_keys: {
      openai: { key: 'sk-test-openai', status: 'valid', validatedAt },
      google: { key: 'sk-test-google', status: 'valid', validatedAt },
      perplexity: { key: 'sk-test-perplexity', status: 'valid', validatedAt },
    },
  });
}

async function createProjectWithPrompt(name: string) {
  const [project] = await db
    .insert(projects)
    .values({ url: `https://${name.toLowerCase()}.example.com`, name, aliases: [] })
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

async function getItemsForRun(runId: string) {
  return db.select().from(collectionRunItems).where(eq(collectionRunItems.run_id, runId));
}

async function getRun(runId: string) {
  const [row] = await db.select().from(collectionRuns).where(eq(collectionRuns.id, runId));
  return row;
}

describe('POST /api/process-prompts/[projectId]', () => {
  it('returns 200 with a runId whose materialised items are pinned to the requested Project, and the loop drives the Run to completed', async () => {
    await setAllProviderKeys();
    const { project } = await createProjectWithPrompt('Example');

    const res = await postOneProject(
      makeRequest(`http://localhost/api/process-prompts/${project.id}`) as never,
      makeParams(project.id)
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.runId).toBeTruthy();

    const items = await getItemsForRun(body.runId);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.project_id === project.id)).toBe(true);

    // Proves the route actually calls `ensureCollectionRunLoopIsRunning()`: nothing else in this
    // test drives the loop, so if that call were removed the Run would sit `pending` forever and
    // the assertions below would fail.
    await waitForCollectionRunLoop();
    const run = await getRun(body.runId);
    expect(run?.status).toBe('completed');
    const finishedItems = await getItemsForRun(body.runId);
    expect(finishedItems.every((item) => item.status === 'completed')).toBe(true);
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
  it('returns 200 with a runId whose materialised items are pinned to the resolved Project, and the loop drives the Run to completed', async () => {
    await setAllProviderKeys();
    const { project } = await createProjectWithPrompt('Example');

    const res = await postAllProjects();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.runId).toBeTruthy();

    const items = await getItemsForRun(body.runId);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.project_id === project.id)).toBe(true);

    await waitForCollectionRunLoop();
    const run = await getRun(body.runId);
    expect(run?.status).toBe('completed');
  });

  it('is a no-op returning the already-in-flight Run when one is pending (criterion 13)', async () => {
    const [existingRun] = await db
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

    const res = await postAllProjects();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.runId).toBe(existingRun.id);
    expect(await db.select().from(collectionRuns)).toHaveLength(1);

    // Drains the seeded (item-less) Run before afterEach cleans up.
    await waitForCollectionRunLoop();
  });

  it('creates exactly one collection_runs row when two app-wide POSTs race (criterion 13)', async () => {
    await setAllProviderKeys();
    await createProjectWithPrompt('Example');

    const [resA, resB] = await Promise.all([postAllProjects(), postAllProjects()]);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    const [bodyA, bodyB] = await Promise.all([resA.json(), resB.json()]);
    expect(bodyA.runId).toBe(bodyB.runId);

    const runs = await db.select().from(collectionRuns);
    expect(runs).toHaveLength(1);

    await waitForCollectionRunLoop();
  });
});

describe('POST /api/process-prompts/[projectId] — shouldForce semantics', () => {
  it('materialises zero items when unforced and an existing Prompt Response already covers today, but the full set when shouldForce is true', async () => {
    await setAllProviderKeys();
    const { project, prompt } = await createProjectWithPrompt('ForceCase');

    // A Prompt Response already exists for today, from outside this Run (no run_id).
    await db.insert(promptResponses).values({
      text: 'already collected today',
      chatbot_id: ChatbotId.ChatGPT,
      prompt_id: prompt.id,
      project_id: project.id,
      model_id: 'existing-model',
    });

    const unforcedRes = await postOneProject(
      makeRequest(`http://localhost/api/process-prompts/${project.id}`) as never,
      makeParams(project.id)
    );
    expect(unforcedRes.status).toBe(200);
    const unforcedBody = await unforcedRes.json();
    expect(await getItemsForRun(unforcedBody.runId)).toHaveLength(0);
    await waitForCollectionRunLoop();

    const forcedRes = await postOneProject(
      makeRequest(`http://localhost/api/process-prompts/${project.id}?shouldForce=true`) as never,
      makeParams(project.id)
    );
    expect(forcedRes.status).toBe(200);
    const forcedBody = await forcedRes.json();
    const forcedItems = await getItemsForRun(forcedBody.runId);
    expect(forcedItems).toHaveLength(3);
    expect(forcedItems.every((item) => item.project_id === project.id)).toBe(true);
    await waitForCollectionRunLoop();
  });
});
