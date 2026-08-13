import { expect, test } from '../helpers/test';
import { E2E_ARTICLE_ID, seedArticleFixture } from '../helpers/articleFixture';
import { TEST_PROJECT_ID } from '../constants';

test.describe('Prompt article workflow — visual baseline', () => {
  test('captures deterministic outline and editor states', async ({
    page,
    e2eServer,
  }, testInfo) => {
    const promptId = await seedArticleFixture(
      e2eServer.databasePath,
      testInfo.project.name === 'visual-mobile'
    );
    await page.goto(
      `/project/${TEST_PROJECT_ID}/prompts/${promptId}/new-article?promptArticleId=${E2E_ARTICLE_ID}`
    );
    if (testInfo.project.name === 'visual-mobile') {
      await expect(page.getByLabel('Article markdown editor')).toBeVisible();
      await expect(page).toHaveScreenshot('article-editor.png');
      return;
    }
    await expect(page.getByRole('article', { name: 'Article outline' })).toBeVisible();
    await expect(page).toHaveScreenshot('article-outline.png');
  });
});
