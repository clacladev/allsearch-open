import { test, expect } from './helpers/test';
import { BRANDS_URL, SETTINGS_COMPETITORS_URL, TEST_DATE_RANGE } from './constants';

test.describe('Brands page', () => {
  test('loads brands page with header and controls', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${BRANDS_URL}${TEST_DATE_RANGE}`);

    await expect(page.getByRole('heading', { name: 'Brands', exact: true })).toBeVisible();
    await expect(page.getByLabel('Date range picker')).toBeVisible();
    // Settings link (Button with href renders as <a> via AriaLink)
    await expect(page.locator('main').getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('displays the brand sources table', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${BRANDS_URL}${TEST_DATE_RANGE}`);

    await expect(
      page.getByRole('table', { name: 'Brand Sources List' })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('export triggers a CSV download', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${BRANDS_URL}${TEST_DATE_RANGE}`);

    // Wait for table data to load before exporting
    await expect(
      page.getByRole('table', { name: 'Brand Sources List' })
    ).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByRole('menuitem', { name: 'Export as CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('settings button links to competitors settings', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(BRANDS_URL);

    await page.locator('main').getByRole('link', { name: 'Settings' }).click();
    await page.waitForURL(`**${SETTINGS_COMPETITORS_URL}`);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('brand selector changes the URL and filter changes reset the page', async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto(`${BRANDS_URL}${TEST_DATE_RANGE}&pageNo=2`);
    await page.getByRole('button', { name: /Select brands|Meridian/ }).click();
    const option = page.getByRole('option').first();
    await option.click();
    await page.waitForURL('**brandIds=**');

    await page.getByRole('button', { name: 'Filters' }).click();
    await page.getByRole('button', { name: 'Title' }).click();
    await page.getByPlaceholder('Filter by title...').fill('running');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.waitForURL('**filter_title=running**');
    expect(page.url()).not.toContain('pageNo=2');
  });
});
