import { sql } from 'drizzle-orm';
import { createDatabase } from '../../../libs/database/client';
import type { PromptArticleRow } from '../../../libs/database/PromptArticles/types';
import { TEST_PROJECT_ID } from '../constants';

export const E2E_ARTICLE_ID = '1f04c1fd-7d15-4fba-a0e6-4c7c3e8b20d8';
export const E2E_OUTLINE_FIRST_ID = '2f04c1fd-7d15-4fba-a0e6-4c7c3e8b20d8';
export const E2E_OUTLINE_REGENERATED_ID = '3f04c1fd-7d15-4fba-a0e6-4c7c3e8b20d8';

export type OutlineWorkflowFixture = {
  promptId: string;
  firstOutline: PromptArticleRow;
  regeneratedOutline: PromptArticleRow;
};

/**
 * Seeds rows used by the mocked outline-generation E2E flow. The client pins
 * the generated row id in the URL after each response, so these rows let the
 * real Next server resolve the replacement navigation without calling Gemini.
 */
export async function seedOutlineWorkflowFixture(
  databasePath: string
): Promise<OutlineWorkflowFixture> {
  const db = await createDatabase(databasePath);
  try {
    const promptId = await getFixturePromptId(db);
    const firstOutline = promptArticleFixture(
      E2E_OUTLINE_FIRST_ID,
      promptId,
      'Mocked Outline Title'
    );
    const regeneratedOutline = promptArticleFixture(
      E2E_OUTLINE_REGENERATED_ID,
      promptId,
      'Regenerated Outline Title'
    );

    await db.run(sql`DELETE FROM prompt_articles WHERE id = ${E2E_OUTLINE_FIRST_ID}`);
    await db.run(sql`DELETE FROM prompt_articles WHERE id = ${E2E_OUTLINE_REGENERATED_ID}`);
    await insertPromptArticleFixture(db, firstOutline);
    await insertPromptArticleFixture(db, regeneratedOutline);

    return { promptId, firstOutline, regeneratedOutline };
  } finally {
    (db as unknown as { $client: { close(): void } }).$client.close();
  }
}

export async function seedArticleFixture(
  databasePath: string,
  withArticle = false
): Promise<string> {
  const db = await createDatabase(databasePath);
  try {
    const promptId = await getFixturePromptId(db);
    const outline = JSON.stringify({
      version: 1,
      headings: [
        {
          tag: 'h1',
          text: 'A deterministic article outline',
          keyPoint: 'Introduce the reader to the subject.',
        },
        {
          tag: 'h2',
          text: 'The first useful section',
          keyPoint: 'Explain the primary decision clearly.',
        },
        {
          tag: 'h2',
          text: 'A practical conclusion',
          keyPoint: 'Leave the reader with next steps.',
        },
      ],
    });
    const article = withArticle
      ? '# A deterministic article\n\nThis saved article gives the editor a stable visual state.\n\n## The first useful section\n\nUseful, readable content.'
      : null;
    await db.run(sql`DELETE FROM prompt_articles WHERE id = ${E2E_ARTICLE_ID}`);
    await db.run(
      sql`INSERT INTO prompt_articles (id, project_id, prompt_id, opportunity_type, outline, article_markdown, outline_model_id, sources_used, outline_used, article_model_id, target_word_count, style_guide, pages_to_link, target_keywords, created_at, updated_at) VALUES (${E2E_ARTICLE_ID}, ${TEST_PROJECT_ID}, ${promptId}, 'ProjectSourceNotFoundOpportunity', ${outline}, ${article}, 'e2e-model', '{"sources":[]}', ${outline}, ${withArticle ? 'e2e-model' : null}, 1500, 'Direct and useful.', '["https://meridianrun.co/pricing"]', '["local search", "article workflow"]', '2026-08-01T12:00:00.000Z', '2026-08-01T12:00:00.000Z')`
    );
    return promptId;
  } finally {
    (db as unknown as { $client: { close(): void } }).$client.close();
  }
}

async function getFixturePromptId(db: Awaited<ReturnType<typeof createDatabase>>): Promise<string> {
  const [prompt] = await db.all<{ id: string }>(
    sql`SELECT id FROM prompts WHERE project_id = ${TEST_PROJECT_ID} ORDER BY created_at LIMIT 1`
  );
  if (!prompt) throw new Error('E2E fixture project has no prompt.');
  return prompt.id;
}

function promptArticleFixture(id: string, promptId: string, title: string): PromptArticleRow {
  const outline: PromptArticleRow['outline'] = {
    version: 1,
    headings: [
      { tag: 'h1', text: title, keyPoint: 'Introduce the topic clearly.' },
      { tag: 'h2', text: 'Section One', keyPoint: 'Cover the basics.' },
      { tag: 'h2', text: 'Final Thoughts', keyPoint: 'Summarize the key takeaways.' },
    ],
  };
  return {
    id,
    project_id: TEST_PROJECT_ID,
    prompt_id: promptId,
    opportunity_id: null,
    opportunity_type: 'ProjectSourceNotFoundOpportunity',
    target_source_clean_url: null,
    outline,
    user_edited_outline: null,
    article_markdown: null,
    user_edited_article_markdown: null,
    sources_used: null,
    outline_used: null,
    article_model_id: null,
    outline_model_id: 'e2e-model',
    target_word_count: 1500,
    style_guide: 'Direct and useful.',
    pages_to_link: ['https://meridianrun.co/pricing'],
    target_keywords: ['local search', 'article workflow'],
    created_at: '2026-08-01T12:00:00.000Z',
    updated_at: '2026-08-01T12:00:00.000Z',
  };
}

async function insertPromptArticleFixture(
  db: Awaited<ReturnType<typeof createDatabase>>,
  row: PromptArticleRow
): Promise<void> {
  await db.run(
    sql`INSERT INTO prompt_articles (id, project_id, prompt_id, opportunity_id, opportunity_type, target_source_clean_url, outline, article_markdown, outline_model_id, user_edited_outline, user_edited_article_markdown, sources_used, outline_used, article_model_id, target_word_count, style_guide, pages_to_link, target_keywords, created_at, updated_at) VALUES (${row.id}, ${row.project_id}, ${row.prompt_id}, ${row.opportunity_id}, ${row.opportunity_type}, ${row.target_source_clean_url}, ${JSON.stringify(row.outline)}, ${row.article_markdown}, ${row.outline_model_id}, ${row.user_edited_outline ? JSON.stringify(row.user_edited_outline) : null}, ${row.user_edited_article_markdown}, ${row.sources_used ? JSON.stringify(row.sources_used) : null}, ${row.outline_used ? JSON.stringify(row.outline_used) : null}, ${row.article_model_id}, ${row.target_word_count}, ${row.style_guide}, ${JSON.stringify(row.pages_to_link)}, ${JSON.stringify(row.target_keywords)}, ${row.created_at}, ${row.updated_at})`
  );
}
