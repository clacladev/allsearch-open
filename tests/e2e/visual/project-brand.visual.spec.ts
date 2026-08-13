import { test, expect } from '../helpers/test';
import { SETTINGS_BRAND_URL } from '../constants';

test.describe('Project Brand settings — visual baseline', () => {
  test('project settings brand tab', async ({ page }, testInfo) => {
    test.setTimeout(30_000);
    await page.goto(SETTINGS_BRAND_URL);
    await expect(page.getByRole('heading', { name: 'Your Brand' })).toBeVisible();
    await expect(page.locator('input[name="brandUrl"]')).toHaveValue(/.+/, { timeout: 15_000 });

    const expectedThemeClass = testInfo.project.name === 'visual-dark' ? 'dark-mode' : 'light-mode';
    await expect(page.locator('html')).toHaveClass(new RegExp(expectedThemeClass));
    await expect(page).toHaveScreenshot();
  });
});
