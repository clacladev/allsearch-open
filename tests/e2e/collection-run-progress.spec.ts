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

test('shows streaming Collection Run progress, then swaps to the report', async ({ page }) => {
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

  await page.goto(`/new-project/report/${MOCK_PROJECT_ID}?runId=${MOCK_RUN_ID}`);

  // --- The progress surface, fed by the mocked `progress` frame from the first stream request ---
  const progressSurface = page.getByTestId('collection-run-progress');
  await expect(progressSurface).toBeVisible();
  await expect(progressSurface.getByTestId('collection-run-progress-count')).toHaveText('1 of 2');
  await expect(progressSurface.getByTestId('collection-run-progress-cancel')).toBeVisible();
  await expect(progressSurface.getByText('ChatGPT').first()).toBeVisible();

  // --- The EventSource reconnects on its own once the first response ends; the second stream
  // request's `done` frame flips `isRunInProgress` to false and the Report component stops
  // rendering the collecting surface. The actual report content (the "Your Brand AI Visibility
  // Report" panel) is server-rendered from `getOverviewPageData`, which the mocked `MOCK_PROJECT_ID`
  // is not backed by a real DB row (issue 17); asserting the report content belongs to the
  // DB-seeded fresh-install suite (issue 21). What we assert here is just the streaming protocol. ---
  await expect(progressSurface).not.toBeVisible();
  expect(streamRequestCount).toBeGreaterThanOrEqual(2);
});
