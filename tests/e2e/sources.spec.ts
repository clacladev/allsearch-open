import { test, expect } from './helpers/test';
import { SOURCES_CONTENTS_URL, SOURCES_DOMAINS_URL, TEST_DATE_RANGE } from './constants';

test.describe('Sources Contents', () => {
  test('loads sources contents page with header and controls', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(SOURCES_CONTENTS_URL);

    await expect(page.getByRole('heading', { name: 'Sources Contents' })).toBeVisible();
    await expect(page.getByLabel('Date range picker')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    // ButtonGroup items use id attributes
    // ToggleButtonGroup with selectionMode="single" renders items as role="radio"
    await expect(page.getByRole('radio', { name: 'Contents' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Domains' })).toBeVisible();
    await expect(page.getByText(/\d+ sources/)).toBeVisible();
  });

  test('displays the source contents table', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${SOURCES_CONTENTS_URL}${TEST_DATE_RANGE}`);

    await expect(
      page.getByRole('grid', { name: 'Source Contents List' })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('export triggers a CSV download', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${SOURCES_CONTENTS_URL}${TEST_DATE_RANGE}`);

    // Wait for table to load before exporting
    await expect(
      page.getByRole('grid', { name: 'Source Contents List' })
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

    await page.getByRole('radio', { name: 'Domains' }).click();
    await page.waitForURL('**/sources/domains**');
    await expect(page.getByRole('heading', { name: 'Sources Domains' })).toBeVisible();
  });
});

test.describe('Sources Domains', () => {
  test('loads the sources domains page', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${SOURCES_DOMAINS_URL}${TEST_DATE_RANGE}`);

    await expect(page.getByRole('heading', { name: 'Sources Domains' })).toBeVisible();
    await expect(
      page.getByRole('grid', { name: 'Source Domains List' })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('export triggers a CSV download', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(`${SOURCES_DOMAINS_URL}${TEST_DATE_RANGE}`);

    // Wait for table to load before exporting
    await expect(
      page.getByRole('grid', { name: 'Source Domains List' })
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

    await page.getByRole('radio', { name: 'Contents' }).click();
    await page.waitForURL('**/sources/contents**');
    await expect(page.getByRole('heading', { name: 'Sources Contents' })).toBeVisible();
  });
});
