import { test, expect } from '../helpers/test';
import { SETTINGS_ORGANIZATION_URL } from '../constants';

// Runs under the visual-light, visual-dark, and visual-mobile projects only
// (see playwright.config.ts testMatch/testIgnore split). Proves the
// light/dark/mobile screenshot regression suite for the migrated Organization
// settings tab (screen SCREEN-020).
test.describe('Organization settings — visual baseline', () => {
  test('project settings organization tab', async ({ page }, testInfo) => {
    test.setTimeout(30_000);

    await page.goto(SETTINGS_ORGANIZATION_URL);

    await expect(page.getByRole('heading', { name: 'Your Organization' })).toBeVisible();
    await expect(page.getByRole('radiogroup')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('radio', { name: 'Agency' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();

    const expectedThemeClass = testInfo.project.name === 'visual-dark' ? 'dark-mode' : 'light-mode';
    await expect(page.locator('html')).toHaveClass(new RegExp(expectedThemeClass));

    await expect(page).toHaveScreenshot();
  });
});
