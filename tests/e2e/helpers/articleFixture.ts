import { sql } from 'drizzle-orm';
import { createDatabase } from '../../../libs/database/client';
import { TEST_PROJECT_ID } from '../constants';

export const E2E_ARTICLE_ID = '1f04c1fd-7d15-4fba-a0e6-4c7c3e8b20d8';

export async function seedArticleFixture(
  databasePath: string,
  withArticle = false
): Promise<string> {
  const db = await createDatabase(databasePath);
  try {
    const [prompt] = await db.all<{ id: string }>(
      sql`SELECT id FROM prompts WHERE project_id = ${TEST_PROJECT_ID} ORDER BY created_at LIMIT 1`
    );
    if (!prompt) throw new Error('E2E fixture project has no prompt.');
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
      sql`INSERT INTO prompt_articles (id, project_id, prompt_id, opportunity_type, outline, article_markdown, outline_model_id, sources_used, outline_used, article_model_id, target_word_count, style_guide, pages_to_link, target_keywords, created_at, updated_at) VALUES (${E2E_ARTICLE_ID}, ${TEST_PROJECT_ID}, ${prompt.id}, 'ProjectSourceNotFoundOpportunity', ${outline}, ${article}, 'e2e-model', '{"sources":[]}', ${outline}, ${withArticle ? 'e2e-model' : null}, 1500, 'Direct and useful.', '["https://meridianrun.co/pricing"]', '["local search", "article workflow"]', '2026-08-01T12:00:00.000Z', '2026-08-01T12:00:00.000Z')`
    );
    return prompt.id;
  } finally {
    (db as unknown as { $client: { close(): void } }).$client.close();
  }
}
