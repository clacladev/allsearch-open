import { test, expect } from './helpers/test';
import { SOURCES_CONTENTS_URL, SOURCES_DOMAINS_URL, TEST_DATE_RANGE } from './constants';

test.describe('Sources Contents', () => {
  test('loads sources contents page with header and controls', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(SOURCES_CONTENTS_URL);

    await expect(page.getByRole('heading', { name: 'Sources Contents' })).toBeVisible();
    await expect(page.getByLabel('Date range picker')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Contents' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Domains' })).toBeVisible();
    await expect(page.getByText(/\d+ sources/)).toBeVisible();
  });

  test('displays the source contents table', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${SOURCES_CONTENTS_URL}${TEST_DATE_RANGE}`);

    await expect(
      page.getByRole('table', { name: 'Source Contents List' })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('export triggers a CSV download', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${SOURCES_CONTENTS_URL}${TEST_DATE_RANGE}`);

    // Wait for table to load before exporting
    await expect(
      page.getByRole('table', { name: 'Source Contents List' })
    ).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByRole('menuitem', { name: 'Export as CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('can switch to domains tab', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(SOURCES_CONTENTS_URL);

    await page.getByRole('button', { name: 'Domains' }).click();
    await page.waitForURL('**/sources/domains**');
    await expect(page.getByRole('heading', { name: 'Sources Domains' })).toBeVisible();
  });

  test('applies and cancels date edits without losing URL parameters', async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto(`${SOURCES_CONTENTS_URL}${TEST_DATE_RANGE}`);

    await page.getByLabel('Date range picker').click();
    await page.getByLabel('Start date').fill('2026-07-10');
    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(page.url()).toContain('startDate=2026-07-01');

    await page.getByLabel('Date range picker').click();
    await page.getByLabel('Start date').fill('2026-07-10');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.waitForURL('**startDate=2026-07-10**');
    expect(page.url()).toContain('endDate=2026-08-31');
  });

  test('supports keyboard source-type navigation and keeps the table scrollable on mobile', async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${SOURCES_CONTENTS_URL}${TEST_DATE_RANGE}`);
    const domains = page.getByRole('button', { name: 'Domains' });
    await domains.focus();
    await page.keyboard.press('Space');
    await page.waitForURL('**/sources/domains**');
    await expect(page.getByRole('table', { name: 'Source Domains List' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Source Domains List' }).locator('..')).toHaveCSS('overflow-x', 'auto');
  });
});

test.describe('Sources Domains', () => {
  test('loads the sources domains page', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${SOURCES_DOMAINS_URL}${TEST_DATE_RANGE}`);

    await expect(page.getByRole('heading', { name: 'Sources Domains' })).toBeVisible();
    await expect(
      page.getByRole('table', { name: 'Source Domains List' })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('export triggers a CSV download', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${SOURCES_DOMAINS_URL}${TEST_DATE_RANGE}`);

    // Wait for table to load before exporting
    await expect(
      page.getByRole('table', { name: 'Source Domains List' })
    ).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByRole('menuitem', { name: 'Export as CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('can switch back to contents tab', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(SOURCES_DOMAINS_URL);

    await page.getByRole('button', { name: 'Contents' }).click();
    await page.waitForURL('**/sources/contents**');
    await expect(page.getByRole('heading', { name: 'Sources Contents' })).toBeVisible();
  });
});
