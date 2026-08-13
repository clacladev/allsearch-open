import { expect, test } from './helpers/test';
import { TEST_DATE_RANGE, TEST_PROJECT_ID } from './constants';
import { seedOutlineWorkflowFixture } from './helpers/articleFixture';

/**
 * Exercises the outline workflow from a known prompt instead of navigating an
 * opportunity list whose contents vary with the fixture date range. Generation
 * stays mocked so these browser tests never need a Gemini credential.
 */
test.describe('New Article outline page', () => {
  test('generates, copies, and regenerates an outline through mocked API calls', async ({
    page,
    context,
    e2eServer,
  }) => {
    test.setTimeout(60_000);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const { promptId, firstOutline, regeneratedOutline } = await seedOutlineWorkflowFixture(
      e2eServer.databasePath
    );
    const outlineApiUrl = `**/api/project/${TEST_PROJECT_ID}/prompts/${promptId}/prompt-articles`;
    let generationCalls = 0;

    await page.route(outlineApiUrl, async (route) => {
      expect(route.request().method()).toBe('POST');
      generationCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          promptArticle: generationCalls === 1 ? firstOutline : regeneratedOutline,
        }),
      });
    });

    await page.goto(
      `/project/${TEST_PROJECT_ID}/prompts/${promptId}/new-article${TEST_DATE_RANGE}`
    );
    await expect(page.getByRole('heading', { name: 'New article' })).toBeVisible();

    await page.getByRole('button', { name: 'Generate outline' }).click();
    await expect(page.getByRole('article', { name: 'Article outline' })).toBeVisible();
    await expect(page.getByRole('textbox').first()).toHaveValue('Mocked Outline Title');

    await page.getByRole('button', { name: 'Copy markdown' }).click();
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();

    await page.getByRole('button', { name: 'Regenerate' }).click();
    await expect(page.getByRole('textbox').first()).toHaveValue('Regenerated Outline Title');
    await expect(page).toHaveURL(new RegExp(`promptArticleId=${regeneratedOutline.id}`));
    expect(generationCalls).toBe(2);
  });

  test('autosaves outline edits with a PATCH to the generated row', async ({ page, e2eServer }) => {
    test.setTimeout(60_000);

    const { promptId, firstOutline } = await seedOutlineWorkflowFixture(e2eServer.databasePath);
    const outlineId = firstOutline.id as string;
    const outlineUrl = `/project/${TEST_PROJECT_ID}/prompts/${promptId}/new-article?promptArticleId=${outlineId}${TEST_DATE_RANGE.replace('?', '&')}`;
    const outlineApiUrl = `**/api/project/${TEST_PROJECT_ID}/prompts/${promptId}/prompt-articles/${outlineId}`;
    const patchBodies: Array<{ userEditedOutline: unknown }> = [];

    await page.route(outlineApiUrl, async (route) => {
      expect(route.request().method()).toBe('PATCH');
      const patchBody = route.request().postDataJSON() as { userEditedOutline: unknown };
      patchBodies.push(patchBody);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          promptArticle: { ...firstOutline, user_edited_outline: patchBody.userEditedOutline },
        }),
      });
    });

    await page.goto(outlineUrl);
    await expect(page.getByRole('article', { name: 'Article outline' })).toBeVisible();

    await page.getByRole('textbox').first().fill('A Better Original Title');

    await expect(page.getByText(/^Saved /)).toBeVisible({ timeout: 5_000 });
    expect(patchBodies).toHaveLength(1);
    const savedPatch = patchBodies[0]!;
    expect(savedPatch.userEditedOutline).toEqual({
      version: 1,
      headings: [
        {
          tag: 'h1',
          text: 'A Better Original Title',
          keyPoint: 'Introduce the topic clearly.',
        },
        { tag: 'h2', text: 'Section One', keyPoint: 'Cover the basics.' },
        { tag: 'h2', text: 'Final Thoughts', keyPoint: 'Summarize the key takeaways.' },
      ],
    });
  });
});
