import { test, expect } from './helpers/test';
import {
  ACCOUNT_SETTINGS_URL,
  SETTINGS_URL,
  SETTINGS_COMPETITORS_URL,
  SETTINGS_BRAND_URL,
  SETTINGS_ORGANIZATION_URL,
} from './constants';

// ---------------------------------------------------------------------------
// App settings
// ---------------------------------------------------------------------------

test.describe('App settings navigation', () => {
  test('organizes app settings into tabs', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(ACCOUNT_SETTINGS_URL);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Provider keys' })).toBeVisible();

    await page.getByRole('tab', { name: 'Chatbots' }).click();
    await expect(page.getByRole('heading', { name: 'Chatbots' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'ChatGPT' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Provider keys' })).not.toBeVisible();

    await page.getByRole('tab', { name: 'Data' }).click();
    await expect(page.getByRole('heading', { name: 'Data', exact: true })).toBeVisible();
  });

  test('uses the native select to switch global settings on mobile', async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ACCOUNT_SETTINGS_URL);

    const tabs = page.getByRole('combobox', { name: 'Settings tabs' });
    await expect(tabs).toHaveValue('provider-keys');
    await tabs.selectOption('chatbots');
    await expect(page.getByRole('heading', { name: 'Chatbots' })).toBeVisible();
    await tabs.selectOption('data');
    await expect(page.getByRole('heading', { name: 'Data', exact: true })).toBeVisible();
  });

  test('keeps a failed confirmation open for retry and allows cancelling it', async ({ page }) => {
    let fulfillArchive: (() => void) | undefined;
    const archiveRequest = new Promise<void>((resolve) => {
      fulfillArchive = resolve;
    });

    await page.route('**/api/project/*/archive', async (route) => {
      await archiveRequest;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Archive failed' }),
      });
    });

    await page.goto(ACCOUNT_SETTINGS_URL);
    await page.getByRole('tab', { name: 'Developer' }).click();
    await page.getByRole('button', { name: 'Archive' }).first().click();

    const dialog = page.getByRole('alertdialog');
    const confirmButton = dialog.getByRole('button', { name: 'Confirm' });
    const actionButton = dialog.getByRole('button').nth(1);
    const cancelButton = dialog.getByRole('button', { name: 'Cancel' });
    await confirmButton.click();
    await expect(actionButton).toBeDisabled();
    await expect(cancelButton).toBeDisabled();

    fulfillArchive?.();
    await expect(dialog).toBeVisible();
    await expect(actionButton).toBeEnabled();
    await cancelButton.click();
    await expect(dialog).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

test.describe('Settings navigation', () => {
  test('settings page redirects to competitors tab', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(SETTINGS_URL);
    await page.waitForURL(`**${SETTINGS_COMPETITORS_URL}`);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('can navigate between settings tabs', async ({ page }) => {
    test.setTimeout(45_000);

    await page.goto(SETTINGS_COMPETITORS_URL);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Navigate to Brand tab
    await page.getByRole('tab', { name: 'Brand' }).click();
    await page.waitForURL(`**${SETTINGS_BRAND_URL}`);

    // Navigate to Organization tab
    await page.getByRole('tab', { name: 'Organization' }).click();
    await page.waitForURL(`**${SETTINGS_ORGANIZATION_URL}`);

    // Navigate back to Competitors tab
    await page.getByRole('tab', { name: 'Competitors' }).click();
    await page.waitForURL(`**${SETTINGS_COMPETITORS_URL}`);
  });

  test('uses the native select to navigate project settings on mobile', async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SETTINGS_COMPETITORS_URL);

    const tabs = page.getByRole('combobox', { name: 'Settings tabs' });
    await expect(tabs).toHaveValue('competitors');
    await tabs.selectOption('brand');
    await page.waitForURL(`**${SETTINGS_BRAND_URL}`);
    await expect(tabs).toHaveValue('brand');
    await tabs.selectOption('organization');
    await page.waitForURL(`**${SETTINGS_ORGANIZATION_URL}`);
  });
});

// ---------------------------------------------------------------------------
// Competitors
// ---------------------------------------------------------------------------

test.describe('Settings — Competitors', () => {
  test('displays existing competitors', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(SETTINGS_COMPETITORS_URL);

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    // Existing competitor URLs use placeholder "https://brand.com"
    await expect(
      page.locator('input[placeholder="https://brand.com"]').first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('input[placeholder="Name"]').first()).toBeVisible();
  });

  test('shows validation for invalid URL', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(SETTINGS_COMPETITORS_URL);

    // Wait for competitor inputs to load
    await expect(
      page.locator('input[placeholder="https://brand.com"]').first()
    ).toBeVisible({ timeout: 15_000 });

    // Fill the new competitor URL input with an invalid URL
    await page.locator('input[placeholder="https://competitor.com"]').fill('not-a-url');

    // Wait for debounced validation
    await page.waitForTimeout(600);

    await expect(page.getByText('Invalid URL')).toBeVisible();
  });

  test('archive and restore a competitor', async ({ page }) => {
    // Uses real DB: archives then immediately restores, leaving DB in original state.
    test.setTimeout(30_000);

    await page.goto(SETTINGS_COMPETITORS_URL);

    // Wait for competitors to load
    await expect(
      page.locator('input[placeholder="https://brand.com"]').first()
    ).toBeVisible({ timeout: 15_000 });

    // Click the first archive button (icon-only Minus button within competitor row)
    // Each row has: InputGroup (URL), Input (Name), Button (archive)
    // Find rows containing the brand URL inputs and click the button in the first one
    const competitorRows = page.locator('div.flex.flex-row.gap-2').filter({
      has: page.locator('input[placeholder="https://brand.com"]'),
    });
    await competitorRows.first().locator('button').click();

    // Assert "Competitor archived" toast
    await expect(page.getByText('Competitor archived')).toBeVisible({ timeout: 10_000 });

    // Expand the archived section
    await page.getByRole('button', { name: /Show archived competitors/i }).click();

    // Click the restore (Plus) button on the first archived competitor
    const archivedRow = page.locator('.opacity-60').first();
    await archivedRow.locator('button').last().click();

    // Assert "Competitor restored" toast
    await expect(page.getByText('Competitor restored')).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------

test.describe('Settings — Brand', () => {
  test('displays current brand settings', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(SETTINGS_BRAND_URL);

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.locator('input[name="brandUrl"]')).toHaveValue(/.+/, {
      timeout: 15_000,
    });
    await expect(page.locator('input[name="brandName"]')).toHaveValue(/.+/);
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  test('target location checkbox toggles input', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(SETTINGS_BRAND_URL);

    // Wait for brand form to load
    await expect(page.locator('input[name="brandUrl"]')).toHaveValue(/.+/, {
      timeout: 15_000,
    });

    const checkbox = page.getByRole('checkbox', { name: 'I want to target a specific location' });
    await expect(checkbox).toBeVisible();

    const targetInput = page.locator('input[name="targetLocation"]');

    // Toggle: click once, check input appeared/disappeared, click again to restore
    await page.getByText('I want to target a specific location', { exact: true }).click();

    const isNowVisible = await targetInput.isVisible();

    // Click again to restore original state
    await page.getByText('I want to target a specific location', { exact: true }).click();

    if (isNowVisible) {
      // First click showed the input, second click should hide it
      await expect(targetInput).not.toBeVisible();
    } else {
      // First click hid the input, second click should show it
      await expect(targetInput).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

test.describe('Settings — Organization', () => {
  test('displays current organization settings', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(SETTINGS_ORGANIZATION_URL);

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('radiogroup')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });
});
