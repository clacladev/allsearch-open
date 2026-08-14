import { test, expect } from '../helpers/test';
import { SETTINGS_COMPETITORS_URL } from '../constants';

// Runs under the visual-light, visual-dark, and visual-mobile projects only.
// The project fixture supplies deterministic seeded competitors, so this captures
// the migrated settings form without network-dependent metadata lookup.
test.describe('Competitor settings — visual baseline', () => {
  test('project settings competitors tab', async ({ page }, testInfo) => {
    test.setTimeout(30_000);

    await page.goto(SETTINGS_COMPETITORS_URL);

    await expect(page.getByRole('heading', { name: 'Competitors' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Competitor URL' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: 'Add competitor' })).toBeVisible();

    const expectedThemeClass = testInfo.project.name === 'visual-dark' ? 'dark-mode' : 'light-mode';
    await expect(page.locator('html')).toHaveClass(new RegExp(expectedThemeClass));

    await expect(page).toHaveScreenshot();
  });
});
