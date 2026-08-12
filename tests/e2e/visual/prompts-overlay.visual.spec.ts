import { expect, test } from '../helpers/test';
import { TEST_PROJECT_ID } from '../constants';

test.describe('Prompt sheet — visual baseline', () => {
  test('captures the opened prompt editor', async ({ page }, testInfo) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/prompts`);
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('dialog', { name: 'Add new prompt' })).toBeVisible();
    await expect(page.locator('html')).toHaveClass(
      new RegExp(testInfo.project.name === 'visual-dark' ? 'dark-mode' : 'light-mode')
    );
    await expect(page).toHaveScreenshot('prompt-sheet-open.png');
  });
});
