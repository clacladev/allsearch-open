import 'server-only';

import { and, desc, eq } from 'drizzle-orm';

import { getDatabase } from '../client';
import { promptArticles } from '../schema';
import { ArticleOutline, PromptArticleRow, ArticleSourcesUsed } from './types';

type InsertPromptArticleRowInput = Omit<PromptArticleRow, 'id' | 'created_at' | 'updated_at'>;

export async function getPromptArticleRowWithId(id: string): Promise<PromptArticleRow | undefined> {
  const db = await getDatabase();
  const rows = await db.select().from(promptArticles).where(eq(promptArticles.id, id)).limit(1);
  return rows[0];
}

/**
 * Fetch every article row generated for a single opportunity, newest first.
 * Powers the "Previously generated articles" section on the opportunity
 * detail page.
 */
export async function getPromptArticleRowsForOpportunityId(input: {
  projectId: string;
  opportunityId: string;
}): Promise<PromptArticleRow[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(promptArticles)
    .where(
      and(
        eq(promptArticles.project_id, input.projectId),
        eq(promptArticles.opportunity_id, input.opportunityId)
      )
    )
    .orderBy(desc(promptArticles.updated_at));
}

/**
 * Fetch every article row generated for a single prompt across all
 * opportunity types. Powers the "Previously generated articles" section on
 * the prompt detail page, where multiple opportunities can produce articles
 * for the same prompt.
 */
export async function getPromptArticleRowsForPromptId(input: {
  projectId: string;
  promptId: string;
}): Promise<PromptArticleRow[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(promptArticles)
    .where(
      and(
        eq(promptArticles.project_id, input.projectId),
        eq(promptArticles.prompt_id, input.promptId)
      )
    )
    .orderBy(desc(promptArticles.updated_at));
}

export async function insertPromptArticleRow(
  input: InsertPromptArticleRowInput
): Promise<PromptArticleRow> {
  const db = await getDatabase();
  const [row] = await db.insert(promptArticles).values(input).returning();
  if (!row) throw new Error('Insert into prompt_articles returned no row');
  return row;
}

/**
 * Patch any subset of the four user-controlled article settings on a row.
 * Powers the outline-view settings panel: each field can change independently
 * and the row's defaults stay intact for fields we don't touch. Pass `null`
 * for `styleGuide` to clear it.
 */
export async function updatePromptArticleSettings(
  id: string,
  fields: {
    targetWordCount?: number;
    styleGuide?: string | null;
    pagesToLink?: string[];
    targetKeywords?: string[];
  }
): Promise<PromptArticleRow> {
  const db = await getDatabase();
  const update: Record<string, unknown> = {};
  if (fields.targetWordCount !== undefined) update.target_word_count = fields.targetWordCount;
  if (fields.styleGuide !== undefined) update.style_guide = fields.styleGuide;
  if (fields.pagesToLink !== undefined) update.pages_to_link = fields.pagesToLink;
  if (fields.targetKeywords !== undefined) update.target_keywords = fields.targetKeywords;
  const [row] = await db
    .update(promptArticles)
    .set(update)
    .where(eq(promptArticles.id, id))
    .returning();
  if (!row) throw new Error(`No prompt_articles row found for id ${id}`);
  return row;
}

export async function updatePromptArticleOutlineEdits(
  id: string,
  userEditedOutline: ArticleOutline | null
): Promise<PromptArticleRow> {
  const db = await getDatabase();
  const [row] = await db
    .update(promptArticles)
    .set({ user_edited_outline: userEditedOutline })
    .where(eq(promptArticles.id, id))
    .returning();
  if (!row) throw new Error(`No prompt_articles row found for id ${id}`);
  return row;
}

/**
 * Atomically persist an AI-generated article. Called from streamText.onFinish
 * with finishReason='stop'. Writes article_markdown, snapshots sources_used,
 * outline_used, and article_model_id, and resets user_edited_article_markdown
 * to null in one UPDATE so we never end up with a half-applied row state on
 * partial failure.
 */
export async function setArticleGeneratedFromStream(
  id: string,
  fields: {
    articleMarkdown: string;
    sourcesUsed: ArticleSourcesUsed;
    outlineUsed: ArticleOutline;
    articleModelId: string;
  }
): Promise<PromptArticleRow> {
  const db = await getDatabase();
  const [row] = await db
    .update(promptArticles)
    .set({
      article_markdown: fields.articleMarkdown,
      user_edited_article_markdown: null,
      sources_used: fields.sourcesUsed,
      outline_used: fields.outlineUsed,
      article_model_id: fields.articleModelId,
    })
    .where(eq(promptArticles.id, id))
    .returning();
  if (!row) throw new Error(`No prompt_articles row found for id ${id}`);
  return row;
}

/**
 * Update only the user-edited article column. Powers autosave (string value)
 * and restore-to-AI (null). Does not touch article_markdown, so the AI version
 * stays intact for restore.
 */
export async function updatePromptArticleUserEditedMarkdown(
  id: string,
  userEditedArticleMarkdown: string | null
): Promise<PromptArticleRow> {
  const db = await getDatabase();
  const [row] = await db
    .update(promptArticles)
    .set({ user_edited_article_markdown: userEditedArticleMarkdown })
    .where(eq(promptArticles.id, id))
    .returning();
  if (!row) throw new Error(`No prompt_articles row found for id ${id}`);
  return row;
}
