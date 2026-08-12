import { test, expect } from './helpers/test';
import { TEST_PROJECT_ID } from './constants';

// ---------------------------------------------------------------------------
// Constants & mock data helpers
// ---------------------------------------------------------------------------

const PROMPTS_URL = `/project/${TEST_PROJECT_ID}/prompts`;
const timestamp = Date.now();

const mockTopicRow = (name: string, id = `mock-topic-${timestamp}`) => ({
  id,
  name,
  project_id: TEST_PROJECT_ID,
  is_archived: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const mockPromptRow = (name: string, topicId = 'mock-topic-custom') => ({
  id: `mock-prompt-${timestamp}`,
  name,
  topic_id: topicId,
  topic_name: 'Custom',
  project_id: TEST_PROJECT_ID,
  is_archived: false,
  created_at: new Date().toISOString(),
});

const MOCK_SUGGESTED_TOPICS = [
  'E2E Suggested Topic A',
  'E2E Suggested Topic B',
  'E2E Suggested Topic C',
];

const MOCK_SUGGESTED_PROMPTS = [
  {
    topic: 'Running Gear',
    prompts: ['Best trail shoes 2024', 'Waterproof hiking boots review', 'Running socks guide'],
  },
];

test.describe('Prompt editing overlays', () => {
  test('sheets expose their names and descriptions, contain focus, and restore focus after Escape or outside interaction', async ({
    page,
  }) => {
    await page.goto(PROMPTS_URL);

    const newPromptTrigger = page.getByRole('button', { name: 'New Prompt' });
    await newPromptTrigger.click();
    const newPromptSheet = page.getByRole('dialog', { name: 'Add new prompt' });
    await expect(newPromptSheet).toBeVisible();
    await expect(newPromptSheet).toContainText('New prompt to monitor for your brand.');
    await expect(newPromptSheet.getByLabel('Topic')).toHaveCount(2);

    for (let index = 0; index < 12; index += 1) await page.keyboard.press('Tab');
    await expect
      .poll(() => newPromptSheet.evaluate((sheet) => sheet.contains(document.activeElement)))
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect(newPromptSheet).not.toBeVisible();
    await expect(newPromptTrigger).toBeFocused();

    await newPromptTrigger.click();
    await page.mouse.click(8, 8);
    await expect(newPromptSheet).not.toBeVisible();
    await expect(newPromptTrigger).toBeFocused();

    const topicsTrigger = page.getByRole('button', { name: 'Topics' });
    await topicsTrigger.click();
    const topicsSheet = page.getByRole('dialog', { name: 'Manage topics' });
    await expect(topicsSheet).toContainText('Organize your prompts into topics.');
    await page.keyboard.press('Escape');
    await expect(topicsTrigger).toBeFocused();
  });

  test('a pending add prompt action cannot submit twice', async ({ page }) => {
    let requestCount = 0;
    let fulfillRequest: (() => void) | undefined;
    const requestFinished = new Promise<void>((resolve) => {
      fulfillRequest = resolve;
    });

    await page.route(`**/api/project/${TEST_PROJECT_ID}/prompts`, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      requestCount += 1;
      await requestFinished;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockPromptRow(`E2E Pending Prompt ${timestamp}`)]),
      });
    });

    await page.goto(PROMPTS_URL);
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await page.getByPlaceholder('New prompt text').fill(`E2E Pending Prompt ${timestamp}`);
    const addButton = page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true });
    await addButton.click();
    await expect(addButton).toBeDisabled();
    await addButton.click({ force: true });
    expect(requestCount).toBe(1);

    fulfillRequest?.();
    await expect(page.getByText('Prompt added')).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 1: Topics management
// ---------------------------------------------------------------------------

test.describe('Topics management', () => {
  test('add a single new topic manually', async ({ page }) => {
    test.setTimeout(30_000);

    await page.route(`**/api/project/${TEST_PROJECT_ID}/topics`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTopicRow(`E2E Test Topic ${timestamp}`)),
        });
      }
      return route.continue();
    });

    await page.goto(PROMPTS_URL);

    // Open the Topics slideout
    await page.getByRole('button', { name: 'Topics' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill the "New topic" input — it's the last input with this placeholder in the Edit tab
    const newTopicInput = page
      .getByRole('dialog')
      .locator('input[placeholder="Topic name"]')
      .last();
    await newTopicInput.fill(`E2E Test Topic ${timestamp}`);
    await newTopicInput.press('Enter');

    // Assert success toast
    await expect(page.getByText('Topic added')).toBeVisible({ timeout: 10_000 });
  });

  test('add multiple suggested topics', async ({ page }) => {
    test.setTimeout(30_000);

    await page.route('**/api/new-project/topics-ideas**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUGGESTED_TOPICS),
      })
    );

    let addCallIndex = 0;
    await page.route(`**/api/project/${TEST_PROJECT_ID}/topics`, (route) => {
      if (route.request().method() === 'POST') {
        const name = MOCK_SUGGESTED_TOPICS[addCallIndex++] ?? `topic-${addCallIndex}`;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTopicRow(name)),
        });
      }
      return route.continue();
    });

    await page.goto(PROMPTS_URL);

    // Open Topics slideout
    await page.getByRole('button', { name: 'Topics' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Switch to Suggested tab
    await page.getByRole('tab', { name: 'Suggested' }).click();

    // Wait for suggestions to load
    await expect(page.getByRole('checkbox', { name: 'E2E Suggested Topic A' })).toBeVisible({
      timeout: 10_000,
    });

    // Assert all 3 suggestions are visible
    await expect(page.getByRole('checkbox', { name: 'E2E Suggested Topic B' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'E2E Suggested Topic C' })).toBeVisible();

    await page.getByRole('checkbox', { name: 'E2E Suggested Topic A' }).click();
    await page.getByRole('checkbox', { name: 'E2E Suggested Topic B' }).click();

    // Click "Add 2 selected" (use first to target the inline button; footer also has one)
    await page
      .getByRole('button', { name: /Add 2 selected/i })
      .first()
      .click();

    // Assert success toast (exact: true avoids matching "2 topics added" description)
    await expect(page.getByText('Topics added', { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test('footer Done button becomes "Add N selected" when topics are checked', async ({ page }) => {
    test.setTimeout(30_000);

    await page.route('**/api/new-project/topics-ideas**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUGGESTED_TOPICS),
      })
    );

    let addCallIndex = 0;
    await page.route(`**/api/project/${TEST_PROJECT_ID}/topics`, (route) => {
      if (route.request().method() === 'POST') {
        const name = MOCK_SUGGESTED_TOPICS[addCallIndex++] ?? `topic-${addCallIndex}`;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTopicRow(name)),
        });
      }
      return route.continue();
    });

    await page.goto(PROMPTS_URL);

    // Open Topics slideout
    await page.getByRole('button', { name: 'Topics' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Footer should show "Done" initially
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Done' })).toBeVisible();

    // Switch to Suggested tab
    await page.getByRole('tab', { name: 'Suggested' }).click();

    // Wait for suggestions to load
    await expect(page.getByRole('checkbox', { name: 'E2E Suggested Topic A' })).toBeVisible({
      timeout: 10_000,
    });

    // Footer should still show "Done" with nothing selected
    await expect(dialog.getByRole('button', { name: 'Done' })).toBeVisible();

    // Check one topic
    await page.getByRole('checkbox', { name: 'E2E Suggested Topic A' }).click();

    // Footer button should now say "Add 1 selected" instead of "Done"
    await expect(dialog.getByRole('button', { name: 'Done' })).not.toBeVisible();

    // There should be two "Add 1 selected" buttons (inline + footer)
    const addBtns = dialog.getByRole('button', { name: /Add 1 selected/i });
    await expect(addBtns).toHaveCount(2);

    // Click the footer "Add 1 selected" (last one) — it should trigger the save
    await addBtns.last().click();

    // Assert success toast
    await expect(page.getByText('Topics added', { exact: true })).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Prompt management
// ---------------------------------------------------------------------------

test.describe('Prompt management', () => {
  test('add a single new prompt manually', async ({ page }) => {
    test.setTimeout(30_000);

    await page.route(`**/api/project/${TEST_PROJECT_ID}/prompts`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockPromptRow(`E2E Single Prompt ${timestamp}`)]),
        });
      }
      return route.continue();
    });

    await page.goto(PROMPTS_URL);

    // Open new prompt slideout
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill prompt input
    const promptInput = page.getByRole('dialog').locator('input[placeholder="New prompt text"]');
    await promptInput.fill(`E2E Single Prompt ${timestamp}`);

    // Click inline "Add" button (exact match to avoid matching "Add prompts" bulk button)
    await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click();

    // Assert success toast and input cleared
    await expect(page.getByText('Prompt added')).toBeVisible({ timeout: 10_000 });
    await expect(promptInput).toHaveValue('');
  });

  test('bulk import prompts', async ({ page }) => {
    test.setTimeout(30_000);

    const bulkPrompts = [
      `E2E Bulk Prompt 1 ${timestamp}`,
      `E2E Bulk Prompt 2 ${timestamp}`,
      `E2E Bulk Prompt 3 ${timestamp}`,
    ];

    await page.route(`**/api/project/${TEST_PROJECT_ID}/prompts`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(bulkPrompts.map((name) => mockPromptRow(name))),
        });
      }
      return route.continue();
    });

    await page.goto(PROMPTS_URL);

    // Open new prompt slideout
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill bulk import textarea (one prompt per line)
    const textarea = page.getByRole('dialog').locator('textarea');
    await textarea.fill(bulkPrompts.join('\n'));

    // Assert button shows "Add 3 prompts"
    const bulkAddBtn = page.getByRole('dialog').getByRole('button', { name: /Add 3 prompt/i });
    await expect(bulkAddBtn).toBeVisible();

    // Click bulk add
    await bulkAddBtn.click();

    // Assert success toast (exact: true avoids matching "3 prompts added" description)
    await expect(page.getByText('Prompts added', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(textarea).toHaveValue('');
  });

  test('add suggested prompts', async ({ page }) => {
    test.setTimeout(30_000);

    await page.route('**/api/new-project/prompt-ideas**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUGGESTED_PROMPTS),
      })
    );

    await page.route(`**/api/project/${TEST_PROJECT_ID}/prompts`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            mockPromptRow('Best trail shoes 2024'),
            mockPromptRow('Waterproof hiking boots review'),
          ]),
        });
      }
      return route.continue();
    });

    await page.goto(PROMPTS_URL);

    // Open new prompt slideout
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Switch to Suggested tab
    await page.getByRole('tab', { name: 'Suggested' }).click();

    // Wait for suggestions to load — topic group heading is visible
    await expect(page.getByText('Running Gear')).toBeVisible({ timeout: 10_000 });

    // Assert individual prompt checkboxes are visible
    await expect(page.getByRole('checkbox', { name: 'Best trail shoes 2024' })).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: 'Waterproof hiking boots review' })
    ).toBeVisible();

    await page.getByRole('checkbox', { name: 'Best trail shoes 2024' }).click();
    await page.getByRole('checkbox', { name: 'Waterproof hiking boots review' }).click();

    // Assert "Add 2 selected" button is enabled (use first to target the inline button; footer also has one)
    const addSelectedBtn = page
      .getByRole('dialog')
      .getByRole('button', { name: /Add 2 selected/i })
      .first();
    await expect(addSelectedBtn).toBeEnabled();

    // Click add
    await addSelectedBtn.click();

    // Assert success toast
    await expect(page.getByText('Prompts added', { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test('footer Done button becomes "Add N selected" when prompts are checked', async ({ page }) => {
    test.setTimeout(30_000);

    await page.route('**/api/new-project/prompt-ideas**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUGGESTED_PROMPTS),
      })
    );

    await page.route(`**/api/project/${TEST_PROJECT_ID}/prompts`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockPromptRow('Best trail shoes 2024')]),
        });
      }
      return route.continue();
    });

    await page.goto(PROMPTS_URL);

    // Open new prompt slideout
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const dialog = page.getByRole('dialog');

    // Footer should show "Done" initially
    await expect(dialog.getByRole('button', { name: 'Done' })).toBeVisible();

    // Switch to Suggested tab
    await page.getByRole('tab', { name: 'Suggested' }).click();

    // Wait for suggestions to load
    await expect(page.getByText('Running Gear')).toBeVisible({ timeout: 10_000 });

    // Footer should still show "Done" with nothing selected
    await expect(dialog.getByRole('button', { name: 'Done' })).toBeVisible();

    // Select one prompt
    await page.getByRole('checkbox', { name: 'Best trail shoes 2024' }).click();

    // Footer button should now say "Add 1 selected" instead of "Done"
    await expect(dialog.getByRole('button', { name: 'Done' })).not.toBeVisible();

    // There should be two "Add 1 selected" buttons (inline + footer)
    const addBtns = dialog.getByRole('button', { name: /Add 1 selected/i });
    await expect(addBtns).toHaveCount(2);

    // Click the footer "Add 1 selected" (last one)
    await addBtns.last().click();

    // Assert success toast
    await expect(page.getByText('Prompts added', { exact: true })).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Table interactions
// ---------------------------------------------------------------------------

test.describe('Prompts table interactions', () => {
  test('edit a prompt name', async ({ page }) => {
    test.setTimeout(30_000);

    const editedName = `E2E Edited Prompt ${timestamp}`;

    await page.route(`**/api/project/${TEST_PROJECT_ID}/prompts`, (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPromptRow(editedName)),
        });
      }
      return route.continue();
    });

    await page.goto(PROMPTS_URL);

    // Wait for the prompts table to render
    await expect(page.getByRole('table', { name: 'Prompts List' })).toBeVisible({
      timeout: 15_000,
    });

    // Click the first "Edit" button (ButtonUtility with aria-label="Edit")
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Edit the prompt name
    const nameInput = page.getByRole('dialog').locator('input[placeholder="Prompt text"]');
    await nameInput.clear();
    await nameInput.fill(editedName);

    // Click "Update"
    await page.getByRole('dialog').getByRole('button', { name: 'Update' }).click();

    // Assert success toast
    await expect(page.getByText('Prompt updated')).toBeVisible({ timeout: 10_000 });
  });

  test('update a prompt topic', async ({ page }) => {
    test.setTimeout(30_000);

    const editedName = `E2E Topic Update Prompt ${timestamp}`;

    await page.route(`**/api/project/${TEST_PROJECT_ID}/prompts`, (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...mockPromptRow(editedName), topic_name: 'Custom' }),
        });
      }
      return route.continue();
    });

    await page.goto(PROMPTS_URL);

    // Wait for the prompts table to render
    await expect(page.getByRole('table', { name: 'Prompts List' })).toBeVisible({
      timeout: 15_000,
    });

    // Open edit slideout for first prompt
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Change the name (guarantees hasChanged = true regardless of topic selection)
    const nameInput = page.getByRole('dialog').locator('input[placeholder="Prompt text"]');
    await nameInput.clear();
    await nameInput.fill(editedName);

    // Open the Topic select dropdown (React Aria Select is labelled "Topic")
    await page.getByRole('dialog').getByLabel('Topic').click();

    // Wait for listbox and select the last option (typically "Custom")
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible({ timeout: 5_000 });
    await options.last().click();

    // Click "Update"
    await page.getByRole('dialog').getByRole('button', { name: 'Update' }).click();

    // Assert success toast
    await expect(page.getByText('Prompt updated')).toBeVisible({ timeout: 10_000 });
  });

  test('archive and unarchive a topic', async ({ page }) => {
    // Uses real DB: archives then restores the first active topic, leaving DB in original state.
    test.setTimeout(30_000);

    await page.goto(PROMPTS_URL);

    // Open Topics slideout
    await page.getByRole('button', { name: 'Topics' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Get the active Edit tab panel
    const tabPanel = page.getByRole('tabpanel');
    await expect(tabPanel).toBeVisible();

    // Wait for active topics to load
    await expect(tabPanel.locator('input[placeholder="Topic name"]').first()).toBeVisible({
      timeout: 10_000,
    });

    // Click the first archive (Minus) button — first button in the Edit tab panel
    // corresponds to the first active topic's archive action
    await tabPanel.getByRole('button').first().click();

    // Assert "Topic archived" toast
    await expect(page.getByText('Topic archived')).toBeVisible({ timeout: 10_000 });

    // Assert "Show archived topics" toggle appeared (topic moved to archived section)
    await expect(page.getByRole('button', { name: /Show archived topics/i })).toBeVisible({
      timeout: 5_000,
    });

    // Expand the archived section
    await page.getByRole('button', { name: /Show archived topics/i }).click();

    // Wait for archived section to expand — archived topic rows get opacity-60 class
    const archivedTopicRow = page.getByRole('dialog').locator('.opacity-60').first();
    await expect(archivedTopicRow).toBeVisible({ timeout: 5_000 });

    // Click the restore (Plus) button within the first archived topic row
    await archivedTopicRow.getByRole('button').click();

    // Assert "Topic restored" toast
    await expect(page.getByText('Topic restored')).toBeVisible({ timeout: 10_000 });
  });

  test('archive and unarchive a prompt', async ({ page }) => {
    // Uses real DB: archives then restores the first active prompt, leaving DB in original state.
    test.setTimeout(30_000);

    await page.goto(PROMPTS_URL);

    // Wait for the prompts table to render
    await expect(page.getByRole('table', { name: 'Prompts List' })).toBeVisible({
      timeout: 15_000,
    });

    // Click the first "Archive" button (ButtonUtility with aria-label="Archive")
    await page.getByRole('button', { name: 'Archive' }).first().click();

    // Assert "Prompt archived" toast
    await expect(page.getByText('Prompt archived')).toBeVisible({ timeout: 10_000 });

    // "View archived (N)" button appears because the prompt is now archived in the DB.
    // router.refresh() re-fetches archivedPromptsCount from the real DB.
    await expect(page.getByRole('button', { name: /View archived/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: /View archived/i }).click();

    // Page navigates to ?showArchived=true — wait for archived prompts to load
    await page.waitForURL(/showArchived=true/, { timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Restore' }).first()).toBeVisible({
      timeout: 15_000,
    });

    // Click "Restore" on the first archived prompt (the one we just archived)
    await page.getByRole('button', { name: 'Restore' }).first().click();

    // Assert "Prompt restored" toast
    await expect(page.getByText('Prompt restored')).toBeVisible({ timeout: 10_000 });
  });
});
