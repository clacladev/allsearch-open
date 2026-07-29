import { test, expect } from '@playwright/test';
import { OPPORTUNITIES_URL, TEST_DATE_RANGE } from './constants';

test.describe('Opportunities page', () => {
  test('loads opportunities page with header and controls', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${OPPORTUNITIES_URL}${TEST_DATE_RANGE}`);

    await expect(page.getByRole('heading', { name: 'Opportunities', exact: true })).toBeVisible();
    await expect(page.getByLabel('Date range picker')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
  });

  test('displays the opportunities table', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${OPPORTUNITIES_URL}${TEST_DATE_RANGE}`);

    await expect(
      page.getByRole('grid', { name: 'Opportunities List' })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('export triggers a CSV download', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${OPPORTUNITIES_URL}${TEST_DATE_RANGE}`);

    // Wait for table to load before exporting
    await expect(
      page.getByRole('grid', { name: 'Opportunities List' })
    ).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByRole('menuitem', { name: 'Export as CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
