import { test, expect } from './helpers/test';
import { resetInstallState, seedGoogleKey } from './helpers/installState';

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
];

test.describe('fresh install onboarding', () => {
  test.beforeEach(async ({ e2eServer }) => {
    await resetInstallState(e2eServer.databasePath);
  });

  test('fresh install funnels / to the keys step', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/keys$/);
    await expect(page.getByRole('heading', { name: 'Connect an AI provider' })).toBeVisible();
  });

  test('keys step entry validation', async ({ page }) => {
    await page.goto('/keys');

    const googleKeyInput = page.getByRole('textbox', { name: 'Google API key' });
    const googleFieldContainer = page
      .locator('div')
      .filter({ has: googleKeyInput })
      // `Input` (components/base/input/input.tsx) wraps the raw <input> in its own div, which is
      // the innermost `has: googleKeyInput` match and does not contain the Save button — require
      // both so `.last()` resolves to ProviderKeyField's own container instead.
      .filter({ has: page.getByRole('button', { name: 'Save' }) })
      .last();
    const saveButton = googleFieldContainer.getByRole('button', { name: 'Save' });

    await expect(saveButton).toBeDisabled();
    await googleKeyInput.fill('   ');
    await expect(saveButton).toBeDisabled();
    await googleKeyInput.fill('some-google-key');
    await expect(saveButton).toBeEnabled();
  });

  test('rejected key keeps the user on the keys step', async ({ page }) => {
    await page.route('**/api/settings/provider-keys', (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Google rejected this key.' }),
      });
    });

    await page.goto('/keys');

    const googleKeyInput = page.getByRole('textbox', { name: 'Google API key' });
    const googleFieldContainer = page
      .locator('div')
      .filter({ has: googleKeyInput })
      // `Input` (components/base/input/input.tsx) wraps the raw <input> in its own div, which is
      // the innermost `has: googleKeyInput` match and does not contain the Save button — require
      // both so `.last()` resolves to ProviderKeyField's own container instead.
      .filter({ has: page.getByRole('button', { name: 'Save' }) })
      .last();
    await googleKeyInput.fill('a-bad-google-key');
    await googleFieldContainer.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Google key rejected')).toBeVisible();
    await expect(page.getByText('Google rejected this key.')).toBeVisible();
    await expect(page).toHaveURL(/\/keys$/);
  });

  test('accepted key advances to the organization step', async ({ page, e2eServer }) => {
    await page.route('**/api/settings/provider-keys', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await seedGoogleKey(e2eServer.databasePath);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          providerKeys: [
            {
              provider: 'google',
              lastFour: 'key1',
              status: 'valid',
              validatedAt: new Date().toISOString(),
            },
          ],
          message: 'Key verified.',
        }),
      });
    });

    await page.goto('/keys');

    const googleKeyInput = page.getByRole('textbox', { name: 'Google API key' });
    const googleFieldContainer = page
      .locator('div')
      .filter({ has: googleKeyInput })
      // `Input` (components/base/input/input.tsx) wraps the raw <input> in its own div, which is
      // the innermost `has: googleKeyInput` match and does not contain the Save button — require
      // both so `.last()` resolves to ProviderKeyField's own container instead.
      .filter({ has: page.getByRole('button', { name: 'Save' }) })
      .last();
    await googleKeyInput.fill('a-good-google-key');
    await googleFieldContainer.getByRole('button', { name: 'Save' }).click();

    await page.waitForURL('**/organization');
    await expect(page.getByText('Your Organization')).toBeVisible();
  });

  test('organization step advances into the wizard', async ({ page, e2eServer }) => {
    await page.route('**/api/settings/provider-keys', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await seedGoogleKey(e2eServer.databasePath);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          providerKeys: [
            {
              provider: 'google',
              lastFour: 'key1',
              status: 'valid',
              validatedAt: new Date().toISOString(),
            },
          ],
          message: 'Key verified.',
        }),
      });
    });

    await page.goto('/keys');
    const googleKeyInput = page.getByRole('textbox', { name: 'Google API key' });
    const googleFieldContainer = page
      .locator('div')
      .filter({ has: googleKeyInput })
      // `Input` (components/base/input/input.tsx) wraps the raw <input> in its own div, which is
      // the innermost `has: googleKeyInput` match and does not contain the Save button — require
      // both so `.last()` resolves to ProviderKeyField's own container instead.
      .filter({ has: page.getByRole('button', { name: 'Save' }) })
      .last();
    await googleKeyInput.fill('a-good-google-key');
    await googleFieldContainer.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL('**/organization');

    // In-house avoids the URL/name validation and domain-metadata fetch that the Agency branch needs.
    // The radio-group's native input is visually hidden under its label (react-aria pattern);
    // clicking it directly is blocked by the label intercepting pointer events, but a forced click
    // on the input still fires its native label-association click, same as a real user would trigger.
    await page.getByRole('radio', { name: 'In-house' }).click({ force: true });
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.waitForURL('**/new-project/brand');
    await expect(page.getByRole('heading', { name: 'Your Brand' })).toBeVisible();
  });

  test('draft restore resumes past completed steps (gap 2)', async ({ page, e2eServer }) => {
    await page.route('**/api/settings/provider-keys', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await seedGoogleKey(e2eServer.databasePath);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          providerKeys: [
            {
              provider: 'google',
              lastFour: 'key1',
              status: 'valid',
              validatedAt: new Date().toISOString(),
            },
          ],
          message: 'Key verified.',
        }),
      });
    });
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

    await page.goto('/keys');
    const googleKeyInput = page.getByRole('textbox', { name: 'Google API key' });
    const googleFieldContainer = page
      .locator('div')
      .filter({ has: googleKeyInput })
      // `Input` (components/base/input/input.tsx) wraps the raw <input> in its own div, which is
      // the innermost `has: googleKeyInput` match and does not contain the Save button — require
      // both so `.last()` resolves to ProviderKeyField's own container instead.
      .filter({ has: page.getByRole('button', { name: 'Save' }) })
      .last();
    await googleKeyInput.fill('a-good-google-key');
    await googleFieldContainer.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL('**/organization');

    // The radio-group's native input is visually hidden under its label (react-aria pattern);
    // clicking it directly is blocked by the label intercepting pointer events, but a forced click
    // on the input still fires its native label-association click, same as a real user would trigger.
    await page.getByRole('radio', { name: 'In-house' }).click({ force: true });
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForURL('**/new-project/brand');

    const brandUrlInput = page.getByRole('textbox', { name: /brand url/i });
    await brandUrlInput.fill('https://nike.com');
    const brandNameInput = page.getByRole('textbox', { name: /brand name/i });
    await expect(brandNameInput).toHaveValue('Nike', { timeout: 3000 });
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.waitForURL('**/new-project/topics');
    await expect(page.getByRole('checkbox', { name: 'Running Shoes' })).toBeVisible();

    // Now simulate a fresh visit to /new-project with the draft already in localStorage — it must
    // resume where the draft left off (topics already answered → straight to prompts), not restart
    // at /brand.
    await page.route('**/api/new-project/prompt-ideas**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROMPT_IDEAS),
      })
    );

    await page.goto('/new-project');
    await page.waitForURL('**/new-project/prompts');
    await expect(page).not.toHaveURL(/\/new-project\/brand/);
  });

  test('AI failure recovery reaches a usable keys screen (gap 1)', async ({ page, e2eServer }) => {
    await page.route('**/api/settings/provider-keys', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await seedGoogleKey(e2eServer.databasePath);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          providerKeys: [
            {
              provider: 'google',
              lastFour: 'key1',
              status: 'valid',
              validatedAt: new Date().toISOString(),
            },
          ],
          message: 'Key verified.',
        }),
      });
    });
    await page.route('**/api/new-project/domain-metadata**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DOMAIN_METADATA),
      })
    );

    await page.goto('/keys');
    const googleKeyInput = page.getByRole('textbox', { name: 'Google API key' });
    const googleFieldContainer = page
      .locator('div')
      .filter({ has: googleKeyInput })
      // `Input` (components/base/input/input.tsx) wraps the raw <input> in its own div, which is
      // the innermost `has: googleKeyInput` match and does not contain the Save button — require
      // both so `.last()` resolves to ProviderKeyField's own container instead.
      .filter({ has: page.getByRole('button', { name: 'Save' }) })
      .last();
    await googleKeyInput.fill('a-good-google-key');
    await googleFieldContainer.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL('**/organization');

    // The radio-group's native input is visually hidden under its label (react-aria pattern);
    // clicking it directly is blocked by the label intercepting pointer events, but a forced click
    // on the input still fires its native label-association click, same as a real user would trigger.
    await page.getByRole('radio', { name: 'In-house' }).click({ force: true });
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForURL('**/new-project/brand');

    const brandUrlInput = page.getByRole('textbox', { name: /brand url/i });
    await brandUrlInput.fill('https://nike.com');
    const brandNameInput = page.getByRole('textbox', { name: /brand name/i });
    await expect(brandNameInput).toHaveValue('Nike', { timeout: 3000 });

    // Mirrors `aiErrorToResponseInit` in libs/ai/errors.ts for an INVALID_KEY failure.
    await page.route('**/api/new-project/topics-ideas**', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'The google API key was rejected.',
          code: 'INVALID_KEY',
          provider: 'google',
        }),
      })
    );

    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForURL('**/new-project/topics');

    await expect(page.getByRole('heading', { name: 'API key was rejected' })).toBeVisible();
    await page.getByRole('button', { name: 'Fix your API key' }).click();

    await page.waitForURL('**/keys?fix=1');
    // Recovery must land on a usable keys screen, not bounce to /organization or back into the
    // wizard — the dead end this test guards against (issue 16, gap 1).
    await expect(page.getByRole('textbox', { name: 'Google API key' })).toBeVisible();
  });
});
