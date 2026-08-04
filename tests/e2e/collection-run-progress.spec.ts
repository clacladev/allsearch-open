import { test, expect } from '@playwright/test';

// This spec runs under the `chromium-no-auth` Playwright project (see playwright.config.ts),
// not `chromium` — the app has no auth and no middleware, and `app/(new-project)/**` performs
// no DB-gated redirect, so it can run against a plain dev server with a migrated database.
//
// There is no `webServer` wired up for this project (see playwright.config.ts's comment on why),
// so this relies on `playwright.config.ts`'s default `baseURL` (`https://localhost:3000`, what
// `bun run dev` serves) unless `PLAYWRIGHT_BASE_URL` overrides it.

// The EventSource client *does* reconnect on its own once the server ends a 200 event-stream
// response (see useCollectionRunProgress.ts) — what it won't retry is a non-2xx / wrong-content-type
// response. So the `progress` and `done` frames must arrive as two separate stream requests, exactly
// like production: the first response serves only the `progress` frame and ends the stream; the
// client's resulting reconnect makes a second request, which this route handler answers with the
// `done` frame. Serving both frames in one response would let React batch both `setProgress` calls
// into one commit and the streaming surface would never render — that was the bug in the previous
// version of this test.

const MOCK_PROJECT_ID = 'mock-project-id-nike-e2e';
const MOCK_RUN_ID = 'mock-run-id';

const MOCK_PROGRESS_FRAME = {
  runId: MOCK_RUN_ID,
  status: 'running',
  isTerminal: false,
  promptsTotal: 2,
  promptsCompleted: 1,
  promptsFailed: 0,
  promptsFinished: 1,
  projects: [
    {
      projectId: MOCK_PROJECT_ID,
      projectName: 'Nike',
      promptsTotal: 2,
      promptsCompleted: 1,
      promptsFailed: 0,
      promptsFinished: 1,
      prompts: [
        {
          promptId: 'prompt-1',
          promptName: 'Best running shoes for marathon training',
          status: 'completed',
          chatbots: [{ chatbotId: 'chatgpt', status: 'completed' }],
        },
        {
          promptId: 'prompt-2',
          promptName: 'Nike running shoes vs Adidas comparison',
          status: 'running',
          chatbots: [{ chatbotId: 'chatgpt', status: 'running' }],
        },
      ],
    },
  ],
};

const MOCK_DONE_FRAME = {
  ...MOCK_PROGRESS_FRAME,
  status: 'completed',
  isTerminal: true,
  promptsCompleted: 2,
  promptsFinished: 2,
  projects: [
    {
      ...MOCK_PROGRESS_FRAME.projects[0],
      promptsCompleted: 2,
      promptsFinished: 2,
      prompts: [
        MOCK_PROGRESS_FRAME.projects[0].prompts[0],
        { ...MOCK_PROGRESS_FRAME.projects[0].prompts[1], status: 'completed', chatbots: [{ chatbotId: 'chatgpt', status: 'completed' }] },
      ],
    },
  ],
};

const MOCK_REPORT_DATA = {
  startDate: '2026-03-02',
  endDate: '2026-03-02',
  brands: [
    {
      brandId: MOCK_PROJECT_ID,
      label: 'Nike',
      iconUrl: 'https://example.com/nike-favicon.ico',
      isProject: true,
    },
    {
      brandId: 'competitor-adidas-id',
      label: 'Adidas',
      isProject: false,
    },
  ],
  visibilityDataset: [],
  visibilityScores: [
    { brandId: MOCK_PROJECT_ID, percentage: 75 },
    { brandId: 'competitor-adidas-id', percentage: 50 },
  ],
  rankingsSummary: [
    {
      brandId: MOCK_PROJECT_ID,
      label: 'Nike',
      iconUrl: 'https://example.com/nike-favicon.ico',
      isProject: true,
    },
    { brandId: 'competitor-adidas-id', label: 'Adidas', isProject: false },
  ],
  topSourceDomainsSummary: { data: [], totalCount: 0 },
  topSourceContentSummary: { data: [], totalCount: 0 },
  topOpportunitiesSummary: { data: [], totalCount: 0 },
};

test('shows streaming Collection Run progress, then swaps to the report', async ({ page }) => {
  let reportRequestCount = 0;
  let streamRequestCount = 0;

  await page.route('**/api/collection-runs/*/stream', (route) => {
    streamRequestCount++;
    // First request (initial EventSource connect): serve only the `progress` frame and end the
    // response. Second request (the reconnect the client's EventSource makes on its own once the
    // first response ends): serve the terminal `done` frame.
    const isFirstRequest = streamRequestCount === 1;
    const body = isFirstRequest
      ? `retry: 3000\n\nevent: progress\ndata: ${JSON.stringify(MOCK_PROGRESS_FRAME)}\n\n`
      : `retry: 3000\n\nevent: done\ndata: ${JSON.stringify(MOCK_DONE_FRAME)}\n\n`;
    return route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: { 'Cache-Control': 'no-cache' },
      body,
    });
  });

  await page.route('**/api/new-project/report**', (route) => {
    reportRequestCount++;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_REPORT_DATA),
    });
  });

  await page.goto(`/new-project/report/${MOCK_PROJECT_ID}?runId=${MOCK_RUN_ID}`);

  // --- The progress surface, fed by the mocked `progress` frame from the first stream request ---
  const progressSurface = page.getByTestId('collection-run-progress');
  await expect(progressSurface).toBeVisible();
  await expect(progressSurface.getByTestId('collection-run-progress-count')).toHaveText('1 of 2');
  await expect(progressSurface.getByTestId('collection-run-progress-cancel')).toBeVisible();
  await expect(progressSurface.getByText('ChatGPT').first()).toBeVisible();
  expect(reportRequestCount).toBe(0);

  // --- The EventSource reconnects on its own once the first response ends; the second stream
  // request's `done` frame swaps the surface for the finished report ---
  await expect(page.getByText('Your Brand AI Visibility Report')).toBeVisible();
  expect(streamRequestCount).toBeGreaterThanOrEqual(2);
  expect(reportRequestCount).toBe(1);
});
