import { test, expect } from '../helpers/test';
import { ACCOUNT_SETTINGS_URL } from '../constants';

const SETTINGS_STATES = [
  ['provider-keys', 'Provider keys'],
  ['chatbots', 'Chatbots'],
  ['data', 'Data'],
  ['developer', 'Developer'],
] as const;

test.describe('Global settings — visual baseline', () => {
  test('provider keys, chatbots, data, and developer tabs', async ({ page }, testInfo) => {
    test.setTimeout(30_000);
    await page.goto(ACCOUNT_SETTINGS_URL);

    for (const [tabId, heading] of SETTINGS_STATES) {
      if (testInfo.project.name === 'visual-mobile') {
        await page.getByRole('combobox', { name: 'Settings tabs' }).selectOption(tabId);
      } else {
        await page.getByRole('tab', { name: heading, exact: true }).click();
      }
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();

      const expectedThemeClass = testInfo.project.name === 'visual-dark' ? 'dark-mode' : 'light-mode';
      await expect(page.locator('html')).toHaveClass(new RegExp(expectedThemeClass));
      await expect(page).toHaveScreenshot(`${tabId}.png`);
    }
  });
});
