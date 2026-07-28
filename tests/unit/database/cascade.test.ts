import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';

import { createDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import {
  competitors,
  projects,
  promptArticles,
  promptResponses,
  prompts,
  sources,
  topics,
} from '@/libs/database/schema';
import { cleanupTempDbPath, closeDatabase, createTempDbPath } from './testHelpers';

describe('cascade delete', () => {
  let dbPath: string;
  let db: AllSearchDatabase;

  beforeEach(async () => {
    dbPath = createTempDbPath('cascade');
    process.env.ALLSEARCH_DB_PATH = dbPath;
    db = await createDatabase();
    await migrateDatabase(db, dbPath);
  });

  afterEach(() => {
    delete process.env.ALLSEARCH_DB_PATH;
    closeDatabase(db);
    cleanupTempDbPath(dbPath);
  });

  it('deleting a project removes its competitors, topics, prompts, prompt_responses, sources and prompt_articles', async () => {
    const [project] = await db
      .insert(projects)
      .values({ url: 'https://example.com', name: 'Example', aliases: [] })
      .returning();

    await db
      .insert(competitors)
      .values({ url: 'https://competitor.com', aliases: [], project_id: project.id });

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
        chatbot_id: 'chatgpt',
        prompt_id: prompt.id,
        project_id: project.id,
        workflow_id: 'workflow-1',
        model_id: 'model-1',
      })
      .returning();

    await db.insert(sources).values({
      project_id: project.id,
      prompt_id: prompt.id,
      prompt_response_id: promptResponse.id,
      is_cited: true,
      position: 1,
      clean_url: 'example.com/page',
      url: 'https://example.com/page',
      hostname: 'example.com',
    });

    await db.insert(promptArticles).values({
      project_id: project.id,
      prompt_id: prompt.id,
      opportunity_type: 'new-article',
      outline: { version: 1, headings: [] },
      outline_model_id: 'model-1',
    });

    await db.delete(projects).where(eq(projects.id, project.id));

    expect(
      await db.select().from(competitors).where(eq(competitors.project_id, project.id))
    ).toEqual([]);
    expect(await db.select().from(topics).where(eq(topics.project_id, project.id))).toEqual([]);
    expect(await db.select().from(prompts).where(eq(prompts.project_id, project.id))).toEqual([]);
    expect(
      await db.select().from(promptResponses).where(eq(promptResponses.project_id, project.id))
    ).toEqual([]);
    expect(await db.select().from(sources).where(eq(sources.project_id, project.id))).toEqual([]);
    expect(
      await db.select().from(promptArticles).where(eq(promptArticles.project_id, project.id))
    ).toEqual([]);
  });
});
