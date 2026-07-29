import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { eq, sql } from 'drizzle-orm';

import { createDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import {
  collectionRunItems,
  collectionRuns,
  competitors,
  projects,
  promptArticles,
  promptResponses,
  prompts,
  sources,
  topics,
} from '@/libs/database/schema';
import { cleanupTempDbPath, closeDatabase, createTempDbPath } from './testHelpers';

describe('schema round trip', () => {
  let dbPath: string;
  let db: AllSearchDatabase;

  beforeEach(async () => {
    dbPath = createTempDbPath('schema');
    process.env.ALLSEARCH_DB_PATH = dbPath;
    db = await createDatabase();
    await migrateDatabase(db, dbPath);
  });

  afterEach(() => {
    delete process.env.ALLSEARCH_DB_PATH;
    closeDatabase(db);
    cleanupTempDbPath(dbPath);
  });

  it('writes and reads back every JSON and array column with the right runtime type', async () => {
    const [project] = await db
      .insert(projects)
      .values({
        url: 'https://example.com',
        name: 'Example',
        aliases: ['Example Inc', 'Example Co'],
      })
      .returning();

    const [competitor] = await db
      .insert(competitors)
      .values({
        url: 'https://competitor.com',
        aliases: ['Competitor Inc'],
        project_id: project.id,
      })
      .returning();

    const [topic] = await db
      .insert(topics)
      .values({ name: 'Topic', project_id: project.id })
      .returning();

    const [prompt] = await db
      .insert(prompts)
      .values({ name: 'Prompt', topic_id: topic.id, project_id: project.id })
      .returning();

    const [collectionRun] = await db
      .insert(collectionRuns)
      .values({ status: 'completed' })
      .returning();

    const [promptResponse] = await db
      .insert(promptResponses)
      .values({
        text: 'Response text',
        chatbot_id: ChatbotId.ChatGPT,
        prompt_id: prompt.id,
        project_id: project.id,
        workflow_id: 'workflow-1',
        model_id: 'model-1',
        brand_ids_ranking: ['brand-1', 'brand-2'],
        sentiment: { 'brand-1': 2, 'brand-2': -1 },
        run_id: collectionRun.id,
      })
      .returning();

    const [source] = await db
      .insert(sources)
      .values({
        project_id: project.id,
        prompt_id: prompt.id,
        prompt_response_id: promptResponse.id,
        is_cited: true,
        position: 1,
        clean_url: 'example.com/page',
        url: 'https://example.com/page',
        hostname: 'example.com',
        headings: [{ tag: 'h1', text: 'Heading' }],
        brand_ids_ranking: ['brand-1'],
      })
      .returning();

    const outline = {
      version: 1 as const,
      headings: [{ tag: 'h1' as const, text: 'H', keyPoint: 'K' }],
    };
    const sourcesUsed = { sources: [{ title: 'Source', cleanUrl: 'example.com/page' }] };

    const [promptArticle] = await db
      .insert(promptArticles)
      .values({
        project_id: project.id,
        prompt_id: prompt.id,
        opportunity_type: 'new-article',
        outline,
        outline_model_id: 'model-1',
        user_edited_outline: outline,
        sources_used: sourcesUsed,
        outline_used: outline,
        pages_to_link: ['https://example.com/other'],
        target_keywords: ['keyword'],
      })
      .returning();

    const [collectionRunItem] = await db
      .insert(collectionRunItems)
      .values({
        run_id: collectionRun.id,
        project_id: project.id,
        prompt_id: prompt.id,
        chatbot_id: ChatbotId.Perplexity,
        status: 'pending',
      })
      .returning();

    const [readProject] = await db.select().from(projects).where(eq(projects.id, project.id));
    expect(readProject.aliases).toEqual(['Example Inc', 'Example Co']);
    expect(Array.isArray(readProject.aliases)).toBe(true);

    const [readCompetitor] = await db
      .select()
      .from(competitors)
      .where(eq(competitors.id, competitor.id));
    expect(readCompetitor.aliases).toEqual(['Competitor Inc']);

    const [readPromptResponse] = await db
      .select()
      .from(promptResponses)
      .where(eq(promptResponses.id, promptResponse.id));
    expect(readPromptResponse.brand_ids_ranking).toEqual(['brand-1', 'brand-2']);
    expect(readPromptResponse.sentiment).toEqual({ 'brand-1': 2, 'brand-2': -1 });

    const [readSource] = await db.select().from(sources).where(eq(sources.id, source.id));
    expect(readSource.headings).toEqual([{ tag: 'h1', text: 'Heading' }]);
    expect(readSource.brand_ids_ranking).toEqual(['brand-1']);

    const [readPromptArticle] = await db
      .select()
      .from(promptArticles)
      .where(eq(promptArticles.id, promptArticle.id));
    expect(readPromptArticle.outline).toEqual(outline);
    expect(readPromptArticle.user_edited_outline).toEqual(outline);
    expect(readPromptArticle.sources_used).toEqual(sourcesUsed);
    expect(readPromptArticle.outline_used).toEqual(outline);
    expect(readPromptArticle.pages_to_link).toEqual(['https://example.com/other']);
    expect(readPromptArticle.target_keywords).toEqual(['keyword']);

    const [readCollectionRunItem] = await db
      .select()
      .from(collectionRunItems)
      .where(eq(collectionRunItems.id, collectionRunItem.id));
    expect(readCollectionRunItem.status).toBe('pending');
  });

  it("defaults brand_ids_ranking to [] when omitted on insert", async () => {
    const [project] = await db
      .insert(projects)
      .values({ url: 'https://example.com', name: 'Example', aliases: [] })
      .returning();
    const [topic] = await db
      .insert(topics)
      .values({ name: 'Topic', project_id: project.id })
      .returning();
    const [prompt] = await db
      .insert(prompts)
      .values({ name: 'Prompt', topic_id: topic.id, project_id: project.id })
      .returning();

    const [promptResponse] = await db
      .insert(promptResponses)
      .values({
        text: 'Response text',
        chatbot_id: ChatbotId.ChatGPT,
        prompt_id: prompt.id,
        project_id: project.id,
        workflow_id: 'workflow-1',
        model_id: 'model-1',
      })
      .returning();

    const [readPromptResponse] = await db
      .select()
      .from(promptResponses)
      .where(eq(promptResponses.id, promptResponse.id));
    expect(readPromptResponse.brand_ids_ranking).toEqual([]);
  });

  it('marks id NOT NULL on every table, even though drizzle-kit does not emit it for a text() primaryKey()', async () => {
    // Derived from sqlite_master rather than a hardcoded list — a literal list here would
    // duplicate `EXPECTED_TABLE_NAMES` in migrate.test.ts and could drift from it, silently
    // skipping the NOT NULL check for any table added to one list but not the other.
    const tables = await db.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'`
    );
    for (const { name: tableName } of tables) {
      const columns = await db.all<{ name: string; notnull: number }>(
        sql.raw(`PRAGMA table_info(${tableName})`)
      );
      const idColumn = columns.find((column) => column.name === 'id');
      expect(idColumn?.notnull, `${tableName}.id should be NOT NULL`).toBe(1);
    }
  });
});
