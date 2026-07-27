import { test, expect } from '@playwright/test';
import { OPPORTUNITIES_URL, TEST_DATE_RANGE, TEST_PROJECT_ID } from './constants';

/**
 * Smoke test for the New Article outline page.
 *
 * We navigate through the real opportunity page to reach the new-article page,
 * then intercept the outline generation API so we don't hit Gemini during CI.
 */
test.describe('New Article outline page', () => {
  test('generates an outline via mocked API and lets the user copy and regenerate', async ({
    page,
    context,
  }) => {
    test.setTimeout(60_000);

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Stub the outline generation endpoint with a predictable payload. Using a
    // pattern so we match regardless of the projectId/promptId under test.
    const firstOutlineId = 'outline-first';
    const regenOutlineId = 'outline-regen';
    let callCount = 0;

    await page.route('**/api/project/*/prompts/*/prompt-articles', async (route) => {
      callCount += 1;
      // Each POST inserts a fresh row. The first call seeds the outline; the
      // second (Regenerate) returns the regen row.
      const id = callCount === 1 ? firstOutlineId : regenOutlineId;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          promptArticle: {
            id,
            project_id: TEST_PROJECT_ID,
            organization_id: 'org-test',
            author_id: 'user-test',
            prompt_id: 'prompt-test',
            opportunity_id: null,
            opportunity_type: 'ProjectSourceNotFoundOpportunity',
            target_source_clean_url: null,
            outline: {
              version: 1,
              headings: [
                {
                  tag: 'h1',
                  text:
                    callCount === 1
                      ? 'Mocked Outline Title'
                      : 'Regenerated Outline Title',
                  keyPoint: 'Introduce the topic clearly.',
                },
                {
                  tag: 'h2',
                  text: 'Section One',
                  keyPoint: 'Cover the basics.',
                },
              ],
            },
            user_edited_outline: null,
            article_markdown: null,
            outline_model_id: 'google/gemini-3-flash',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto(`${OPPORTUNITIES_URL}${TEST_DATE_RANGE}`);

    // Click the first Create-type opportunity from the list to reach a detail page.
    // If the test project has no opportunities in the current date range, skip
    // the test rather than flake.
    const firstRow = page.getByRole('row').nth(1);
    if (!(await firstRow.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(
        true,
        'No opportunities available in the test project for the current date range.'
      );
    }
    await firstRow.click();

    const createOutlineCTA = page.getByRole('link', { name: /generate outline/i }).first();
    if (!(await createOutlineCTA.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(
        true,
        'No opportunity with an outline CTA available in the test project for the current date range.'
      );
    }

    await createOutlineCTA.click();

    // The outline should render after the mocked API resolves.
    await expect(page.getByRole('heading', { name: 'New article' })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Article outline' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Mocked Outline Title')).toBeVisible();

    // Copy as markdown should change the button label to "Copied".
    await page.getByRole('button', { name: /copy as markdown/i }).click();
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible({ timeout: 5_000 });

    // Regenerate should trigger a new POST and swap the title in the outline.
    await page.getByRole('button', { name: /regenerate/i }).click();
    await expect(page.getByText('Regenerated Outline Title')).toBeVisible({ timeout: 10_000 });

    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  test('autosaves user edits to the outline title', async ({ page, context }) => {
    test.setTimeout(60_000);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const seedOutlineId = 'outline-seed';

    await page.route('**/api/project/*/prompts/*/prompt-articles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          promptArticle: {
            id: seedOutlineId,
            project_id: TEST_PROJECT_ID,
            organization_id: 'org-test',
            author_id: 'user-test',
            prompt_id: 'prompt-test',
            opportunity_id: null,
            opportunity_type: 'ProjectSourceNotFoundOpportunity',
            target_source_clean_url: null,
            outline: {
              version: 1,
              headings: [
                { tag: 'h1', text: 'Original Title', keyPoint: 'Introduce the topic clearly.' },
                { tag: 'h2', text: 'Section One', keyPoint: 'Cover the basics here.' },
                { tag: 'h2', text: 'Wrap up', keyPoint: 'Summarize the takeaways.' },
              ],
            },
            user_edited_outline: null,
            article_markdown: null,
            outline_model_id: 'google/gemini-3-flash',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
    });

    let patchCount = 0;
    let lastPatchBody: { userEditedOutline: unknown } | null = null;

    await page.route(
      `**/api/project/*/prompts/*/prompt-articles/${seedOutlineId}`,
      async (route) => {
        patchCount += 1;
        const body = route.request().postDataJSON() as { userEditedOutline: unknown };
        lastPatchBody = body;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            promptArticle: {
              id: seedOutlineId,
              project_id: TEST_PROJECT_ID,
              organization_id: 'org-test',
              author_id: 'user-test',
              prompt_id: 'prompt-test',
              opportunity_id: null,
              opportunity_type: 'ProjectSourceNotFoundOpportunity',
              target_source_clean_url: null,
              outline: {
                version: 1,
                headings: [
                  { tag: 'h1', text: 'Original Title', keyPoint: 'Introduce the topic clearly.' },
                  { tag: 'h2', text: 'Section One', keyPoint: 'Cover the basics here.' },
                  { tag: 'h2', text: 'Wrap up', keyPoint: 'Summarize the takeaways.' },
                ],
              },
              user_edited_outline: body.userEditedOutline,
              article_markdown: null,
              outline_model_id: 'google/gemini-3-flash',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
        });
      }
    );

    await page.goto(OPPORTUNITIES_URL);
    const firstRow = page.getByRole('row').nth(1);
    if (!(await firstRow.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(
        true,
        'No opportunities available in the test project for the current date range.'
      );
    }
    await firstRow.click();
    const createOutlineCTA = page.getByRole('link', { name: /generate outline/i }).first();
    if (!(await createOutlineCTA.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(
        true,
        'No opportunity with an outline CTA available in the test project for the current date range.'
      );
    }
    await createOutlineCTA.click();

    await expect(page.getByRole('article', { name: 'Article outline' })).toBeVisible({
      timeout: 10_000,
    });

    // Edit the first heading's title input by appending text.
    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.click();
    await titleInput.fill('A Better Original Title');

    // The autosave debounce is 800ms. Wait for the saved indicator to appear.
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5_000 });

    expect(patchCount).toBeGreaterThanOrEqual(1);
    expect(lastPatchBody).not.toBeNull();
    const body = lastPatchBody as { userEditedOutline: unknown } | null;
    expect(body?.userEditedOutline).not.toBeNull();
  });
});
