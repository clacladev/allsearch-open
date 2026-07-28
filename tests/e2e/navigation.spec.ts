import { test, expect } from '@playwright/test';
import { OVERVIEW_URL } from './constants';

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

test.describe('Sidebar navigation', () => {
  test('sidebar shows all navigation links', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(OVERVIEW_URL);

    const aside = page.locator('aside');
    await expect(aside.getByRole('link', { name: 'Overview' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Sources' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Opportunities' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Prompts' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Brands' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('can navigate between all pages via sidebar', async ({ page }) => {
    test.setTimeout(45_000);

    await page.goto(OVERVIEW_URL);

    const aside = page.locator('aside');

    // Overview → Sources
    await aside.getByRole('link', { name: 'Sources' }).click();
    await page.waitForURL('**/sources/contents**');

    // Sources → Opportunities
    await aside.getByRole('link', { name: 'Opportunities' }).click();
    await page.waitForURL('**/opportunities**');

    // Opportunities → Brands
    await aside.getByRole('link', { name: 'Brands' }).click();
    await page.waitForURL('**/brands**');

    // Brands → Settings
    await aside.getByRole('link', { name: 'Settings' }).click();
    await page.waitForURL('**/settings/competitors**');

    // Settings → Overview
    await aside.getByRole('link', { name: 'Overview' }).click();
    await page.waitForURL(`**${OVERVIEW_URL}`);
  });
});

// ---------------------------------------------------------------------------
// Project selector
// ---------------------------------------------------------------------------

test.describe('Project selector', () => {
  test('can open project selector and see menu items', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(OVERVIEW_URL);

    // Click the project selector trigger (first button in aside)
    await page.locator('aside button').first().click();

    await expect(page.getByText('Switch project')).toBeVisible();
    await expect(page.getByText('Account settings')).toBeVisible();
    await expect(page.getByText('New project')).toBeVisible();
    await expect(page.getByText('Sign out')).toBeVisible();
  });

  test('can navigate to New Project', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(OVERVIEW_URL);

    // Open project selector
    await page.locator('aside button').first().click();
    await expect(page.getByText('New project')).toBeVisible();

    // Click New project link
    await page.getByRole('link', { name: 'New project' }).click();
    await page.waitForURL('**/new-project**');
  });
});

// ---------------------------------------------------------------------------
// Date range persistence
// ---------------------------------------------------------------------------

test.describe('Date range persistence', () => {
  test('custom date range persists when navigating between pages', async ({ page }) => {
    test.setTimeout(45_000);

    // Navigate to overview with custom date range params
    await page.goto(`${OVERVIEW_URL}?startDate=2025-01-01&endDate=2025-01-15`);
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    const aside = page.locator('aside');

    // Navigate to Sources and verify date params persist
    await aside.getByRole('link', { name: 'Sources' }).click();
    await page.waitForURL('**/sources/contents**');
    expect(page.url()).toContain('startDate=2025-01-01');
    expect(page.url()).toContain('endDate=2025-01-15');

    // Navigate to Opportunities
    await aside.getByRole('link', { name: 'Opportunities' }).click();
    await page.waitForURL('**/opportunities**');
    expect(page.url()).toContain('startDate=2025-01-01');
    expect(page.url()).toContain('endDate=2025-01-15');

    // Navigate to Brands
    await aside.getByRole('link', { name: 'Brands' }).click();
    await page.waitForURL('**/brands**');
    expect(page.url()).toContain('startDate=2025-01-01');
    expect(page.url()).toContain('endDate=2025-01-15');

    // Navigate back to Overview
    await aside.getByRole('link', { name: 'Overview' }).click();
    await page.waitForURL(`**${OVERVIEW_URL}**`);
    expect(page.url()).toContain('startDate=2025-01-01');
    expect(page.url()).toContain('endDate=2025-01-15');
  });
});
