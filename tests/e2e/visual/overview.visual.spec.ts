import { expect, test } from '../helpers/test';
import { OVERVIEW_URL, TEST_DATE_RANGE } from '../constants';

test.describe('Overview display surfaces — visual baseline', () => {
  test('captures the migrated chart and coverage surfaces', async ({ page }, testInfo) => {
    test.setTimeout(30_000);
    await page.goto(`${OVERVIEW_URL}${TEST_DATE_RANGE}`);
    await expect(page.getByTestId('overview-collection-run-coverage')).toBeVisible();

    if (testInfo.project.name === 'visual-mobile') {
      await page.getByRole('button', { name: 'Sentiment' }).click();
    }

    const expectedThemeClass = testInfo.project.name === 'visual-dark' ? 'dark-mode' : 'light-mode';
    await expect(page.locator('html')).toHaveClass(new RegExp(expectedThemeClass));
    await expect(page).toHaveScreenshot('overview-display.png');
  });
});
