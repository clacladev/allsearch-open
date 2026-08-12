import { test, expect } from './helpers/test';
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
    await expect(aside.getByRole('link', { name: 'Crawl health' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page'
    );
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

    // Brands → Crawl health → Settings
    await aside.getByRole('link', { name: 'Crawl health' }).click();
    await page.waitForURL('**/crawl-health');

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

    await page.getByRole('button', { name: 'Select project' }).click();

    await expect(page.getByText('Switch project')).toBeVisible();
    await expect(page.getByText('App Settings')).toBeVisible();
    await expect(page.getByText('New project')).toBeVisible();
  });

  test('can navigate to New Project', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(OVERVIEW_URL);

    // Open project selector
    await page.getByRole('button', { name: 'Select project' }).click();
    await expect(page.getByText('New project')).toBeVisible();

    // Click New project link
    await page.getByRole('link', { name: 'New project' }).click();
    await page.waitForURL('**/new-project**');
  });

  test('can navigate to App Settings and cycles themes', async ({ page }) => {
    await page.goto(OVERVIEW_URL);
    await page.getByRole('button', { name: 'Select project' }).click();
    await page.getByRole('button', { name: 'App Settings' }).click();
    await page.waitForURL('**/settings');
    const toggleTheme = page.getByRole('button', { name: 'Toggle theme' });

    await toggleTheme.click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
    await expect(page.locator('html')).toHaveClass(/light-mode/);

    await toggleTheme.click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
    await expect(page.locator('html')).toHaveClass(/dark-mode/);

    await toggleTheme.click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('system');
  });

  test('closes the selector when switching projects', async ({ page }) => {
    await page.goto(OVERVIEW_URL);
    await page.getByRole('button', { name: 'Select project' }).click();

    const selector = page.getByText('Switch project');
    await expect(selector).toBeVisible();
    await page.getByRole('button', { name: 'Meridian Run Co.' }).click();
    await expect(selector).toBeHidden();
  });

  test('closes the selector while navigating to App Settings', async ({ page }) => {
    await page.goto(OVERVIEW_URL);
    await page.getByRole('button', { name: 'Select project' }).click();

    const selector = page.getByText('Switch project');
    await page.getByRole('button', { name: 'App Settings' }).click();
    await expect(selector).toBeHidden();
    await page.waitForURL('**/settings');
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

test.describe('Mobile navigation', () => {
  test('traps navigation focus and returns it to the trigger on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(OVERVIEW_URL);
    const trigger = page.getByRole('button', { name: 'Expand navigation menu' });
    await trigger.click();
    const sheet = page.getByRole('dialog', { name: 'Navigation menu' });
    const closeButton = sheet.getByRole('button', { name: 'Close navigation menu' });
    await expect(sheet).toBeVisible();
    await expect(closeButton).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(sheet.locator(':focus')).toHaveCount(1);
    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
