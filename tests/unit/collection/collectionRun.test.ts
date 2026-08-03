import { mock } from 'bun:test';

// Per the issue 10 harness, only the AI seams are faked here — the query layer, the limiter,
// the retry/cooldown logic, claiming, counters and persistence all run for real against a real
// temp SQLite database (set up below). `aiDelayMs` lets individual tests make the fakes resolve
// after a short, real delay so calls genuinely overlap (case 3) or so a cancel can land mid-run
// (case 5); it defaults to 0 (resolve on the next microtask) everywhere else.
let aiDelayMs = 0;
async function maybeDelay() {
  if (aiDelayMs) await new Promise((resolve) => setTimeout(resolve, aiDelayMs));
}

const defaultChatGPTImpl = async (promptName: string) => {
  await maybeDelay();
  return {
    response: { modelId: 'chatgpt-model' },
    text: `chatgpt response for ${promptName}`,
    sources: [],
    toolResults: [],
  };
};
const defaultGoogleAIModeImpl = async (promptName: string) => {
  await maybeDelay();
  return {
    response: { modelId: 'google-model' },
    text: `google response for ${promptName}`,
    sources: [],
    toolResults: [],
  };
};
const defaultPerplexityImpl = async (promptName: string) => {
  await maybeDelay();
  return {
    response: { modelId: 'perplexity-model' },
    text: `perplexity response for ${promptName}`,
    sources: [],
    toolResults: [],
  };
};
const defaultSentimentImpl = async () => {
  await maybeDelay();
  return {};
};
const defaultSourcesImpl = async () => [];

const mockChatGPT = mock(defaultChatGPTImpl);
const mockGoogleAIMode = mock(defaultGoogleAIModeImpl);
const mockPerplexity = mock(defaultPerplexityImpl);
const mockSentiment = mock(defaultSentimentImpl);
const mockSources = mock(defaultSourcesImpl);

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
// page is fetched. Mocked at the leaf module `libs/collection/analyseSources.ts`, which is what
// `executePrompt.ts` calls.
mock.module('@/libs/collection/analyseSources', () => ({
  analysePromptResponseSources: mockSources,
}));

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { APICallError } from '@ai-sdk/provider';
import {
  cancelCollectionRun,
  createCollectionRun,
  ensureCollectionRunLoopIsRunning,
  MAX_CONCURRENT_AI_CALLS,
  resumeInterruptedCollectionRuns,
  retryFailedCollectionRunItems,
  aiCallLimiter,
} from '@/libs/collection';
import { waitForCollectionRunLoop } from '@/libs/collection/runLoop';
import { MAX_CONCURRENT_PROMPT_GROUPS } from '@/libs/collection/constants';
import { clearProviderCooldowns } from '@/libs/collection/providerCooldown';
import {
  resetDefaultCallAiSleepForTesting,
  setDefaultCallAiSleepForTesting,
} from '@/libs/collection/callAi';
import { claimCollectionRunItemRowsForPrompt } from '@/libs/database/CollectionRunItems/queries';
import { getDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { setProviderKey } from '@/libs/database/Settings/queries';
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

// Real temp SQLite via createTempDbPath/getDatabase/migrateDatabase, keyed on ALLSEARCH_DB_PATH
// (libs/database/client.ts) so this suite doesn't collide with tests/unit/database/settings.test.ts,
// the only other suite allowed to call the memoised getDatabase() directly.
let dbPath: string;
let db: AllSearchDatabase;

beforeAll(async () => {
  dbPath = createTempDbPath('collectionRun');
  process.env.ALLSEARCH_DB_PATH = dbPath;
  db = await getDatabase();
  await migrateDatabase(db, dbPath);
  // The retry/cooldown code is real (per the harness); this is the seam that keeps its real
  // backoff/cooldown timers from actually elapsing — see libs/collection/callAi.ts's comment on
  // `setDefaultCallAiSleepForTesting` for why executePrompt.ts has no other way to inject one.
  setDefaultCallAiSleepForTesting(async () => {});
});

afterAll(() => {
  resetDefaultCallAiSleepForTesting();
  delete process.env.ALLSEARCH_DB_PATH;
  closeDatabase(db);
  cleanupTempDbPath(dbPath);
  // mock.module is process-wide in Bun and does not undo itself when this file finishes.
  mock.restore();
});

beforeEach(async () => {
  // Children cascade away with their Project or Run (see cascade.test.ts).
  await db.delete(projects);
  await db.delete(collectionRuns);
  await db.delete(settings);

  aiDelayMs = 0;
  mockChatGPT.mockReset();
  mockChatGPT.mockImplementation(defaultChatGPTImpl);
  mockGoogleAIMode.mockReset();
  mockGoogleAIMode.mockImplementation(defaultGoogleAIModeImpl);
  mockPerplexity.mockReset();
  mockPerplexity.mockImplementation(defaultPerplexityImpl);
  mockSentiment.mockReset();
  mockSentiment.mockImplementation(defaultSentimentImpl);
  mockSources.mockReset();
  mockSources.mockImplementation(defaultSourcesImpl);

  // providerCooldown is a module-level singleton shared by every caller of callAiWithRetry in the
  // test process, and aiCallLimiter's peak counter is likewise process-wide — both must be reset
  // on both sides of every test, not just one, per the harness.
  clearProviderCooldowns();
  aiCallLimiter.resetCounters();
});

afterEach(() => {
  clearProviderCooldowns();
  aiCallLimiter.resetCounters();
});

function rateLimitedError(message = 'Too many requests') {
  return new APICallError({
    message,
    url: 'https://example.test',
    requestBodyValues: {},
    statusCode: 429,
  });
}

async function setAllProviderKeys() {
  await setProviderKey('openai', 'sk-test-openai', 'valid');
  await setProviderKey('google', 'sk-test-google', 'valid');
  await setProviderKey('perplexity', 'sk-test-perplexity', 'valid');
}

async function createProject(name: string) {
  const [project] = await db
    .insert(projects)
    .values({ url: `https://${name.toLowerCase()}.example.com`, name, aliases: [] })
    .returning();
  return project;
}

async function createPrompts(projectId: string, count: number, namePrefix = 'Prompt') {
  const [topic] = await db
    .insert(topics)
    .values({ name: 'Topic', project_id: projectId })
    .returning();
  return db
    .insert(prompts)
    .values(
      Array.from({ length: count }, (_, index) => ({
        name: `${namePrefix} ${index + 1}`,
        topic_id: topic.id,
        project_id: projectId,
      }))
    )
    .returning();
}

async function getItemsForRun(runId: string) {
  return db.select().from(collectionRunItems).where(eq(collectionRunItems.run_id, runId));
}

async function getResponsesForRun(runId: string) {
  return db.select().from(promptResponses).where(eq(promptResponses.run_id, runId));
}

async function getRun(runId: string) {
  const [row] = await db.select().from(collectionRuns).where(eq(collectionRuns.id, runId));
  return row;
}

async function driveLoopToCompletion() {
  ensureCollectionRunLoopIsRunning();
  await waitForCollectionRunLoop();
}

const ALL_CHATBOT_IDS = [ChatbotId.ChatGPT, ChatbotId.GoogleAIOverview, ChatbotId.Perplexity];

function makeItemInput(
  runId: string,
  projectId: string,
  promptId: string,
  chatbotId: ChatbotId,
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' = 'running'
) {
  return {
    run_id: runId,
    project_id: projectId,
    prompt_id: promptId,
    chatbot_id: chatbotId,
    status,
    attempts: 0,
    error: null,
    started_at: new Date().toISOString(),
    finished_at: null,
  };
}

function makeFabricatedResponseInput(
  runId: string,
  projectId: string,
  promptId: string,
  chatbotId: ChatbotId
) {
  return {
    text: 'fabricated response',
    chatbot_id: chatbotId,
    prompt_id: promptId,
    project_id: projectId,
    model_id: 'fabricated-model',
    run_id: runId,
  };
}

describe('issue 10 Done-when 1 — N x M items created and completed', () => {
  it('creates 12 pending items for 4 prompts x 3 chatbots, then completes them all', async () => {
    await setAllProviderKeys();
    const project = await createProject('Case1');
    await createPrompts(project.id, 4);

    const run = await createCollectionRun({ projectIds: [project.id] });
    expect(run.items_total).toBe(12);
    expect(run.status).toBe('pending');

    const itemsAtCreation = await getItemsForRun(run.id);
    expect(itemsAtCreation).toHaveLength(12);
    expect(itemsAtCreation.every((item) => item.status === 'pending')).toBe(true);

    await driveLoopToCompletion();

    const items = await getItemsForRun(run.id);
    expect(items).toHaveLength(12);
    expect(items.every((item) => item.status === 'completed')).toBe(true);

    const finishedRun = await getRun(run.id);
    expect(finishedRun?.status).toBe('completed');
    expect(finishedRun?.items_completed).toBe(12);
    expect(finishedRun?.items_failed).toBe(0);
    expect(finishedRun?.finished_at).toBeTruthy();

    const responses = await getResponsesForRun(run.id);
    expect(responses).toHaveLength(12);
    expect(responses.every((row) => row.run_id === run.id)).toBe(true);
  });
});

describe('issue 10 Done-when 2 — kill-and-restart resumes without duplicating work', () => {
  it('resumes a run left running by a kill, without reprocessing already-completed items', async () => {
    await setAllProviderKeys();
    const project = await createProject('Case2a');
    const [promptA] = await createPrompts(project.id, 1, 'Prompt A');

    // Real Prompt group, driven to completion for real — "the loop finishes one Prompt group".
    const run = await createCollectionRun({ projectIds: [project.id] });
    expect(run.items_total).toBe(3);
    await driveLoopToCompletion();
    expect((await getRun(run.id))?.status).toBe('completed');
    expect(await getResponsesForRun(run.id)).toHaveLength(3);

    // Simulate a kill that happened while MORE work for this same run was still in flight: a
    // second Prompt's items left `running`, and the run itself left `running` — exactly the state
    // a SIGKILL leaves per the plan's state machine.
    const [promptB] = await createPrompts(project.id, 1, 'Prompt B');
    await db
      .insert(collectionRunItems)
      .values(
        ALL_CHATBOT_IDS.map((chatbotId) => makeItemInput(run.id, project.id, promptB.id, chatbotId))
      );
    await db
      .update(collectionRuns)
      .set({ status: 'running', items_total: 6 })
      .where(eq(collectionRuns.id, run.id));

    await resumeInterruptedCollectionRuns();

    const itemsAfterResume = await getItemsForRun(run.id);
    const promptAItems = itemsAfterResume.filter((item) => item.prompt_id === promptA.id);
    const promptBItems = itemsAfterResume.filter((item) => item.prompt_id === promptB.id);
    // Already-completed work is untouched by resume.
    expect(promptAItems.every((item) => item.status === 'completed')).toBe(true);
    expect(promptBItems.every((item) => item.status === 'pending')).toBe(true);
    expect((await getRun(run.id))?.status).toBe('pending');

    await driveLoopToCompletion();

    const finishedRun = await getRun(run.id);
    expect(finishedRun?.status).toBe('completed');
    const items = await getItemsForRun(run.id);
    expect(items.every((item) => item.status === 'completed')).toBe(true);

    // The real assertion: exactly N x M (2 prompts x 3 chatbots = 6) responses, not more.
    const responses = await getResponsesForRun(run.id);
    expect(responses).toHaveLength(6);
  });

  it('closes the insert-then-die window: a claim-time delete prevents duplicate responses when rows were already inserted before the kill', async () => {
    await setAllProviderKeys();
    const project = await createProject('Case2b');
    const [prompt] = await createPrompts(project.id, 1);

    const run = await createCollectionRun({ projectIds: [project.id] });
    expect(run.items_total).toBe(3);

    // Simulate: the loop claimed this Prompt group and executePrompt's batched insert already
    // landed, but the process died before the item status write — items stay `running`, and the
    // (soon-to-be-stale) responses are already present.
    const claimed = await claimCollectionRunItemRowsForPrompt(run.id, prompt.id, ALL_CHATBOT_IDS);
    expect(claimed).toHaveLength(3);
    await db
      .insert(promptResponses)
      .values(
        ALL_CHATBOT_IDS.map((chatbotId) =>
          makeFabricatedResponseInput(run.id, project.id, prompt.id, chatbotId)
        )
      );
    await db
      .update(collectionRuns)
      .set({ status: 'running', started_at: new Date().toISOString() })
      .where(eq(collectionRuns.id, run.id));
    expect(await getResponsesForRun(run.id)).toHaveLength(3);

    await resumeInterruptedCollectionRuns();
    expect((await getItemsForRun(run.id)).every((item) => item.status === 'pending')).toBe(true);
    expect((await getRun(run.id))?.status).toBe('pending');

    await driveLoopToCompletion();

    expect((await getRun(run.id))?.status).toBe('completed');
    const responses = await getResponsesForRun(run.id);
    // Not 6 — the claim-time delete removed the fabricated rows before the real re-insert.
    expect(responses).toHaveLength(3);
    expect(responses.every((row) => row.text !== 'fabricated response')).toBe(true);
  });
});

describe('issue 10 Done-when 3 — concurrency never exceeds the limit under load', () => {
  it('keeps peak in-flight AI calls within the limit, and above 1 so the assertion is not vacuous', async () => {
    await setAllProviderKeys();
    const project = await createProject('Case3');
    await createPrompts(project.id, 10);
    aiDelayMs = 20;

    const run = await createCollectionRun({ projectIds: [project.id] });
    expect(run.items_total).toBe(30);

    aiCallLimiter.resetCounters();
    await driveLoopToCompletion();

    expect(aiCallLimiter.getPeakInFlightCount()).toBeLessThanOrEqual(MAX_CONCURRENT_AI_CALLS);
    expect(aiCallLimiter.getPeakInFlightCount()).toBeGreaterThan(1);

    const finishedRun = await getRun(run.id);
    expect(finishedRun?.status).toBe('completed');
    expect(finishedRun?.items_completed).toBe(30);
  });
});

describe('issue 10 Done-when 4 — a provider 429 fails only the affected items without failing the run', () => {
  it('fails every Perplexity item after 3 attempts, completes the others, and the run stays completed', async () => {
    await setAllProviderKeys();
    const project = await createProject('Case4');
    const promptCount = 3;
    await createPrompts(project.id, promptCount);
    mockPerplexity.mockImplementation(async () => {
      throw rateLimitedError();
    });

    const run = await createCollectionRun({ projectIds: [project.id] });
    expect(run.items_total).toBe(promptCount * 3);

    await driveLoopToCompletion();

    const items = await getItemsForRun(run.id);
    const perplexityItems = items.filter((item) => item.chatbot_id === ChatbotId.Perplexity);
    const chatGPTItems = items.filter((item) => item.chatbot_id === ChatbotId.ChatGPT);
    const googleItems = items.filter((item) => item.chatbot_id === ChatbotId.GoogleAIOverview);

    expect(perplexityItems).toHaveLength(promptCount);
    expect(perplexityItems.every((item) => item.status === 'failed')).toBe(true);
    expect(perplexityItems.every((item) => item.attempts === 3)).toBe(true);
    expect(perplexityItems.every((item) => !!item.error)).toBe(true);
    expect(chatGPTItems.every((item) => item.status === 'completed')).toBe(true);
    expect(googleItems.every((item) => item.status === 'completed')).toBe(true);

    const runAfterFirstPass = await getRun(run.id);
    expect(runAfterFirstPass?.items_failed).toBe(promptCount);
    expect(runAfterFirstPass?.items_completed).toBe(promptCount * 2);
    expect(runAfterFirstPass?.status).toBe('completed');
    expect(runAfterFirstPass?.error).toBeNull();

    // Flip Perplexity to succeed, then retry — only the failed Chatbot should be re-run.
    mockPerplexity.mockImplementation(async (promptName: string) => ({
      response: { modelId: 'perplexity-model' },
      text: `perplexity retried for ${promptName}`,
      sources: [],
      toolResults: [],
    }));

    await retryFailedCollectionRunItems(run.id);
    await waitForCollectionRunLoop();

    const itemsAfterRetry = await getItemsForRun(run.id);
    expect(itemsAfterRetry.every((item) => item.status === 'completed')).toBe(true);

    const runAfterRetry = await getRun(run.id);
    expect(runAfterRetry?.items_failed).toBe(0);
    expect(runAfterRetry?.items_completed).toBe(promptCount * 3);
    expect(runAfterRetry?.status).toBe('completed');

    // Exactly N x M — retry re-ran only the previously-failed Chatbot, not the already-good ones.
    const responses = await getResponsesForRun(run.id);
    expect(responses).toHaveLength(promptCount * 3);
  });
});

describe('issue 10 — cancellation (non-Done-when case from the plan)', () => {
  it('cancels pending items, still records the in-flight groups outcome, and ends the run cancelled', async () => {
    await setAllProviderKeys();
    const project = await createProject('Case5');
    const promptCount = MAX_CONCURRENT_PROMPT_GROUPS + 3;
    await createPrompts(project.id, promptCount);
    aiDelayMs = 150;

    const run = await createCollectionRun({ projectIds: [project.id] });
    expect(run.items_total).toBe(promptCount * 3);

    ensureCollectionRunLoopIsRunning();
    // Long enough for the loop to claim its first batch of groups (fast, all-local SQLite writes)
    // but well short of aiDelayMs, so some groups are provably still unclaimed when we cancel.
    await new Promise((resolve) => setTimeout(resolve, 40));

    const cancelledRun = await cancelCollectionRun(run.id);
    expect(cancelledRun.id).toBe(run.id);

    await waitForCollectionRunLoop();

    const items = await getItemsForRun(run.id);
    const cancelledItems = items.filter((item) => item.status === 'cancelled');
    const completedItems = items.filter((item) => item.status === 'completed');
    expect(cancelledItems.length).toBeGreaterThan(0);
    expect(completedItems.length).toBeGreaterThan(0);
    expect(cancelledItems.length + completedItems.length).toBe(items.length);

    const finishedRun = await getRun(run.id);
    expect(finishedRun?.status).toBe('cancelled');
    expect(finishedRun?.items_completed).toBe(completedItems.length);
  });

  it('lands a never-started run cancelled itself, since no loop will ever claim it to finalise it', async () => {
    await setAllProviderKeys();
    const project = await createProject('CancelBeforeStart');
    await createPrompts(project.id, 2);

    // Deliberately never starts the loop — this is the "cancel from the runs list before the
    // worker picks it up" case, where nothing else exists to move the run out of `pending`.
    const run = await createCollectionRun({ projectIds: [project.id] });
    expect(run.status).toBe('pending');

    const cancelledRun = await cancelCollectionRun(run.id);
    expect(cancelledRun.status).toBe('cancelled');
    expect(cancelledRun.finished_at).not.toBeNull();

    const items = await getItemsForRun(run.id);
    expect(items.every((item) => item.status === 'cancelled')).toBe(true);
  });
});

describe('issue 10 — paused and archived Projects', () => {
  it('collects nothing for a paused Project even when it is named explicitly, matching the isProjectPaused gate this replaced', async () => {
    await setAllProviderKeys();
    const project = await createProject('Paused');
    await createPrompts(project.id, 2);
    await db.update(projects).set({ is_paused: true }).where(eq(projects.id, project.id));

    const run = await createCollectionRun({ projectIds: [project.id] });

    expect(run.items_total).toBe(0);
    // Zero items is a legitimate no-op, recorded as completed rather than left for the loop.
    expect(run.status).toBe('completed');
    expect(await getItemsForRun(run.id)).toHaveLength(0);
  });

  it('excludes paused and archived Projects from an all-Projects run, matching /api/process-prompts', async () => {
    await setAllProviderKeys();

    const normalProject = await createProject('AllRunNormal');
    await createPrompts(normalProject.id, 2);

    const pausedProject = await createProject('AllRunPaused');
    await createPrompts(pausedProject.id, 2);
    await db.update(projects).set({ is_paused: true }).where(eq(projects.id, pausedProject.id));

    const archivedProject = await createProject('AllRunArchived');
    await createPrompts(archivedProject.id, 2);
    await db
      .update(projects)
      .set({ is_archived: true })
      .where(eq(projects.id, archivedProject.id));

    const run = await createCollectionRun();

    const items = await getItemsForRun(run.id);
    expect(items).toHaveLength(2 * ALL_CHATBOT_IDS.length);
    expect(items.every((item) => item.project_id === normalProject.id)).toBe(true);
  });
});
