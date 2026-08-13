import { test, expect } from '../helpers/test';
import { OVERVIEW_URL } from '../constants';

test.describe('Private navigation shell — visual baseline', () => {
  test('closed desktop shell', async ({ page }, testInfo) => {
    await page.goto(OVERVIEW_URL);
    if (testInfo.project.name === 'visual-mobile') {
      await expect(page.getByRole('button', { name: 'Expand navigation menu' })).toBeVisible();
    } else {
      await expect(page.getByRole('navigation', { name: 'Project navigation' })).toBeVisible();
    }
    await expect(page.getByLabel('Date range picker')).toHaveText('Jul 13, 2026 – Aug 12, 2026');
    if (testInfo.project.name === 'visual-mobile') {
      await page.getByRole('button', { name: 'Expand navigation menu' }).click();
      const navigationMenu = page.getByRole('dialog', { name: 'Navigation menu' });
      await expect(navigationMenu).toBeVisible();
      await expect(navigationMenu.getByText('Next update in 5 days', { exact: true })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(navigationMenu).not.toBeVisible();
    } else {
      await expect(page.getByText('Next update in 5 days', { exact: true })).toBeVisible();
    }
    await expect(page.locator('html')).toHaveClass(new RegExp(testInfo.project.name === 'visual-dark' ? 'dark-mode' : 'light-mode'));
    await expect(page).toHaveScreenshot();
  });

  test('opened navigation overlay', async ({ page }, testInfo) => {
    await page.goto(OVERVIEW_URL);
    if (testInfo.project.name === 'visual-mobile') {
      await page.getByRole('button', { name: 'Expand navigation menu' }).click();
      await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
    } else {
      await page.getByRole('button', { name: 'Select project' }).click();
      await expect(page.getByText('Switch project')).toBeVisible();
    }
    await expect(page).toHaveScreenshot();
  });
});
