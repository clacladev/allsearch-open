import { test, expect } from './helpers/test';
import { OVERVIEW_URL, TEST_DATE_RANGE } from './constants';

test.describe('Overview page', () => {
  test('loads the overview page with header and controls', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(OVERVIEW_URL);

    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await expect(page.getByLabel('Date range picker')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
  });

  test('displays brand visibility chart', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(OVERVIEW_URL);

    await expect(page.getByText('Brand visibility')).toBeVisible({ timeout: 15_000 });
  });

  test('shows top source contents table with View more link', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${OVERVIEW_URL}${TEST_DATE_RANGE}`);

    await expect(page.getByText('Top Source Contents')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'View more' }).first()).toBeVisible();
  });

  test('can toggle between Contents and Domains in overview tables', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(OVERVIEW_URL);

    // Default is Contents
    await expect(page.getByText('Top Source Contents')).toBeVisible({ timeout: 15_000 });

    // Switch to Domains (ToggleButtonGroup renders items as role="radio")
    await page.getByRole('radio', { name: 'Domains' }).click();
    await expect(page.getByText('Top Source Domains')).toBeVisible({ timeout: 15_000 });

    // Switch back to Contents
    await page.getByRole('radio', { name: 'Contents' }).click();
    await expect(page.getByText('Top Source Contents')).toBeVisible({ timeout: 15_000 });
  });

  test('shows opportunities section', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(OVERVIEW_URL);

    // The title text appears in both the heading and its link — use first() to avoid strict mode
    await expect(
      page.locator('main').getByText('Opportunities', { exact: true }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('export triggers a CSV download', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${OVERVIEW_URL}${TEST_DATE_RANGE}`);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByRole('menuitem', { name: 'Export as CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });
});
