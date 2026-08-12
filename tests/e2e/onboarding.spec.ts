import { test, expect } from './helpers/test';
import { TEST_PROJECT_ID } from './constants';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PROJECT_ID = 'mock-project-id-nike-e2e';

const MOCK_DOMAIN_METADATA = {
  name: 'Nike',
  iconUrl: 'https://example.com/nike-favicon.ico',
  url: 'https://nike.com',
};

const MOCK_TOPICS = [
  'Running Shoes',
  'Athletic Apparel',
  'Sports Equipment',
  'Athlete Stories',
  'Fitness Tech',
];

const MOCK_PROMPT_IDEAS = [
  {
    topic: 'Running Shoes',
    prompts: [
      'Best running shoes for marathon training',
      'Nike running shoes vs Adidas comparison',
      'Top trail running shoes reviewed',
    ],
  },
  {
    topic: 'Athletic Apparel',
    prompts: [
      'Best athletic clothing brands',
      'Nike performance wear review',
      'Moisture-wicking workout clothes guide',
    ],
  },
];

const MOCK_COMPETITORS = [
  { name: 'Adidas', url: 'https://adidas.com', iconUrl: 'https://example.com/adidas-favicon.ico' },
  { name: 'Puma', url: 'https://puma.com', iconUrl: '' },
  { name: 'Under Armour', url: 'https://underarmour.com', iconUrl: '' },
];

const MOCK_SAVE_RESPONSE = {
  projectId: MOCK_PROJECT_ID,
  runId: 'mock-run-id-12345',
};

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

test('can complete onboarding flow for a new Nike brand project', { tag: '@ai' }, async ({ page }) => {
  test.setTimeout(90_000);
  // --- Set up API route mocks (must be registered before any navigation) ---

  await page.route('**/api/new-project/domain-metadata**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DOMAIN_METADATA),
    })
  );

  await page.route('**/api/new-project/topics-ideas**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TOPICS),
    })
  );

  await page.route('**/api/new-project/prompt-ideas**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PROMPT_IDEAS),
    })
  );

  await page.route('**/api/new-project/competitors**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_COMPETITORS),
    })
  );

  await page.route('**/api/new-project/save', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SAVE_RESPONSE),
    })
  );

  // --- Step 1: Navigate to the project overview page ---

  await page.goto(`/project/${TEST_PROJECT_ID}`);
  await expect(page).toHaveURL(`/project/${TEST_PROJECT_ID}`);

  // --- Step 2: Open the project selector popup from the sidebar ---
  // The sidebar uses <aside>. The chevron toggle button (AriaDialogTrigger) is the first
  // button inside the aside and opens the project picker popover.
  await page.locator('aside').getByRole('button').first().click();

  // --- Step 3: Click "New project" in the dropdown menu ---
  await page.getByRole('link', { name: 'New project' }).click();

  // --- Step 4: Brand form ---
  // /new-project redirects to /new-project/brand (org already exists for the test user)
  await page.waitForURL('**/new-project/brand');
  await expect(page).toHaveURL(/\/new-project\/brand/);
  await expect(page.getByText('Your Brand')).toBeVisible();

  // Fill in the brand URL — triggers domain-metadata fetch (mocked)
  const brandUrlInput = page.getByRole('textbox', { name: /brand url/i });
  await brandUrlInput.fill('https://nike.com');

  // The 500 ms debounce fires, then the mocked API auto-fills the brand name
  const brandNameInput = page.getByRole('textbox', { name: /brand name/i });
  await expect(brandNameInput).toHaveValue('Nike', { timeout: 3000 });

  // Continue to topics
  await page.getByRole('button', { name: 'Continue' }).click();

  // --- Step 5: Topics form ---
  await page.waitForURL('**/new-project/topics');
  await expect(page).toHaveURL(/\/new-project\/topics/);
  await expect(page.getByText('Suggested Topics')).toBeVisible();

  // All 5 mocked categories should be listed
  await expect(page.getByRole('checkbox', { name: 'Running Shoes' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Athletic Apparel' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Sports Equipment' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Athlete Stories' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Fitness Tech' })).toBeVisible();

  // First 2 categories are pre-selected; the rest are not
  await expect(page.getByRole('checkbox', { name: 'Running Shoes' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Athletic Apparel' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Sports Equipment' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Athlete Stories' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Fitness Tech' })).not.toBeChecked();

  // Continue to prompts
  await page.getByRole('button', { name: 'Continue' }).click();

  // --- Step 6: Prompts form ---
  await page.waitForURL('**/new-project/prompts');
  await expect(page).toHaveURL(/\/new-project\/prompts/);
  await expect(page.getByText('Suggested Prompts')).toBeVisible();

  // Both topics and their prompts must be visible
  await expect(page.getByText('Running Shoes').first()).toBeVisible();
  await expect(page.getByText('Athletic Apparel').first()).toBeVisible();

  const prompt1 = page.getByRole('checkbox', { name: 'Best running shoes for marathon training' });
  const prompt2 = page.getByRole('checkbox', { name: 'Nike running shoes vs Adidas comparison' });
  const prompt3 = page.getByRole('checkbox', { name: 'Top trail running shoes reviewed' });
  const prompt4 = page.getByRole('checkbox', { name: 'Best athletic clothing brands' });
  const prompt5 = page.getByRole('checkbox', { name: 'Nike performance wear review' });
  const prompt6 = page.getByRole('checkbox', { name: 'Moisture-wicking workout clothes guide' });

  // First 2 prompts in each topic are pre-selected
  await expect(prompt1).toBeChecked();
  await expect(prompt2).toBeChecked();
  await expect(prompt3).not.toBeChecked();
  await expect(prompt4).toBeChecked();
  await expect(prompt5).toBeChecked();
  await expect(prompt6).not.toBeChecked();

  // Continue to competitors
  await page.getByRole('button', { name: 'Continue' }).click();

  // --- Step 7: Competitors form ---
  await page.waitForURL('**/new-project/competitors');
  await expect(page).toHaveURL(/\/new-project\/competitors/);
  await expect(page.getByText('Competitors Review')).toBeVisible();

  // All 3 mocked competitors should appear in the URL inputs (disabled, type="url")
  const urlInputs = page.locator('input[type="url"][placeholder="https://brand.com"]');
  await expect(urlInputs.nth(0)).toHaveValue('https://adidas.com');
  await expect(urlInputs.nth(1)).toHaveValue('https://puma.com');
  await expect(urlInputs.nth(2)).toHaveValue('https://underarmour.com');

  // Competitor names appear in the editable name inputs (type="text", placeholder="Name")
  const nameInputs = page.locator('input[type="text"][placeholder="Name"]');
  await expect(nameInputs.nth(0)).toHaveValue('Adidas');
  await expect(nameInputs.nth(1)).toHaveValue('Puma');
  await expect(nameInputs.nth(2)).toHaveValue('Under Armour');

  // Finish — triggers the save step (auto-submits via useSWRImmutable)
  await page.getByRole('button', { name: 'Finish' }).click();

  // --- Step 8: Save step auto-submits and redirects to the report ---
  await page.waitForURL(`**/new-project/report/${MOCK_PROJECT_ID}`, { timeout: 10000 });

  // --- Step 9: Report page ---
  // The report page is now a Server Component that fetches `getOverviewPageData` against the
  // local SQLite DB directly (issue 17 deleted the `/api/new-project/report` route). The mocked
  // save above returns a fake `projectId`, so no real Project row exists for it here, and the
  // server-side fetch surfaces the project's not-found state — meaning we can only assert the
  // navigation landed on the report route at this layer. End-to-end happy-path assertions on
  // the rendered report content (the "Your Brand AI Visibility Report" heading, the "Start
  // Improving Your Visibility" CTA, the redirect to `/project/:projectId`) belong to the
  // DB-seeded fresh-install suite (issue 21), which is the proper home for them now.
});
