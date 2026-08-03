import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { createDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import {
  collectionRuns,
  projects,
  promptArticles,
  promptResponses,
  prompts,
  topics,
} from '@/libs/database/schema';
import { cleanupTempDbPath, closeDatabase, createTempDbPath } from './testHelpers';

/** Asserts the promise rejects specifically because of `constraintName`'s CHECK constraint,
 * rather than passing for any rejection reason (e.g. a missing FK) that would otherwise keep a
 * bare `.rejects.toThrow()` green. The driver's real reason lands on `err.cause`, not
 * `err.message` — drizzle wraps it in a generic `DrizzleQueryError`. */
function expectCheckConstraintViolation(promise: Promise<unknown>, constraintName: string) {
  return expect(promise).rejects.toMatchObject({
    cause: expect.objectContaining({
      message: expect.stringMatching(new RegExp(`CHECK constraint failed: ${constraintName}`)),
    }),
  });
}

describe('CHECK constraints', () => {
  let dbPath: string;
  let db: AllSearchDatabase;

  beforeEach(async () => {
    dbPath = createTempDbPath('checks');
    process.env.ALLSEARCH_DB_PATH = dbPath;
    db = await createDatabase();
    await migrateDatabase(db, dbPath);
  });

  afterEach(() => {
    delete process.env.ALLSEARCH_DB_PATH;
    closeDatabase(db);
    cleanupTempDbPath(dbPath);
  });

  it('rejects a target_word_count outside 300–5000', async () => {
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

    await expectCheckConstraintViolation(
      Promise.resolve(
        db.insert(promptArticles).values({
          project_id: project.id,
          prompt_id: prompt.id,
          opportunity_type: 'new-article',
          outline: { version: 1, headings: [] },
          outline_model_id: 'model-1',
          target_word_count: 100,
        })
      ),
      'prompt_articles_target_word_count_range'
    );

    await expectCheckConstraintViolation(
      Promise.resolve(
        db.insert(promptArticles).values({
          project_id: project.id,
          prompt_id: prompt.id,
          opportunity_type: 'new-article',
          outline: { version: 1, headings: [] },
          outline_model_id: 'model-1',
          target_word_count: 6000,
        })
      ),
      'prompt_articles_target_word_count_range'
    );
  });

  it('rejects an unknown chatbot_id', async () => {
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

    await expectCheckConstraintViolation(
      Promise.resolve(
        db.insert(promptResponses).values({
          text: 'Response text',
          chatbot_id: 'not-a-real-chatbot' as ChatbotId,
          prompt_id: prompt.id,
          project_id: project.id,
          model_id: 'model-1',
        })
      ),
      'prompt_responses_chatbot_id_check'
    );
  });

  it('rejects an unknown collection_runs.status', async () => {
    await expectCheckConstraintViolation(
      Promise.resolve(db.insert(collectionRuns).values({ status: 'not-a-real-status' })),
      'collection_runs_status_check'
    );
  });
});
