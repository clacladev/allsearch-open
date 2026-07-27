import 'server-only';

import { createClient } from '../supabase/serverAsAdmin';
import {
  ArticleOutline,
  PromptArticleRow,
  ArticleSourcesUsed,
  TABLE_PROMPT_ARTICLES,
} from './types';
import { DEFAULT_QUERY_OPTIONS, QueryOptions } from '../shared/QueryOptions';

type InsertPromptArticleRowInput = Omit<PromptArticleRow, 'id' | 'created_at' | 'updated_at'>;

export async function getLatestPromptArticle(
  input: {
    authorId: string;
    projectId: string;
    promptId: string;
    opportunityType: string;
    targetSourceCleanUrl: string | null;
  },
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptArticleRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  let query = supabase
    .from(TABLE_PROMPT_ARTICLES)
    .select()
    .eq('author_id', input.authorId)
    .eq('project_id', input.projectId)
    .eq('prompt_id', input.promptId)
    .eq('opportunity_type', input.opportunityType);

  // Postgres treats NULL = NULL as NULL (not true), so match null vs non-null separately.
  if (input.targetSourceCleanUrl === null) {
    query = query.is('target_source_clean_url', null);
  } else {
    query = query.eq('target_source_clean_url', input.targetSourceCleanUrl);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? undefined;
}

export async function getPromptArticleRowWithId(
  id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptArticleRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_ARTICLES)
    .select()
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ?? undefined;
}

/**
 * Fetch every article row this author has generated for a single opportunity,
 * newest first. Powers the "Previously generated articles" section on the
 * opportunity detail page. Scope-by-author mirrors the editor flow, which only
 * surfaces the current user's outlines via `getLatestPromptArticle`.
 */
export async function getPromptArticleRowsForOpportunityId(
  input: { authorId: string; projectId: string; opportunityId: string },
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptArticleRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_ARTICLES)
    .select()
    .eq('author_id', input.authorId)
    .eq('project_id', input.projectId)
    .eq('opportunity_id', input.opportunityId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch every article row this author has generated for a single prompt across
 * all opportunity types. Powers the "Previously generated articles" section on
 * the prompt detail page, where multiple opportunities can produce articles for
 * the same prompt.
 */
export async function getPromptArticleRowsForPromptId(
  input: { authorId: string; projectId: string; promptId: string },
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptArticleRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_ARTICLES)
    .select()
    .eq('author_id', input.authorId)
    .eq('project_id', input.projectId)
    .eq('prompt_id', input.promptId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertPromptArticleRow(
  input: InsertPromptArticleRowInput,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptArticleRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_ARTICLES)
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
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
  },
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptArticleRow> {
  const supabase = await createClient(options.asAdmin);
  const update: Record<string, unknown> = {};
  if (fields.targetWordCount !== undefined) update.target_word_count = fields.targetWordCount;
  if (fields.styleGuide !== undefined) update.style_guide = fields.styleGuide;
  if (fields.pagesToLink !== undefined) update.pages_to_link = fields.pagesToLink;
  if (fields.targetKeywords !== undefined) update.target_keywords = fields.targetKeywords;
  const { data, error } = await supabase
    .from(TABLE_PROMPT_ARTICLES)
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePromptArticleOutlineEdits(
  id: string,
  userEditedOutline: ArticleOutline | null,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptArticleRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_ARTICLES)
    .update({ user_edited_outline: userEditedOutline })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
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
  },
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptArticleRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_ARTICLES)
    .update({
      article_markdown: fields.articleMarkdown,
      user_edited_article_markdown: null,
      sources_used: fields.sourcesUsed,
      outline_used: fields.outlineUsed,
      article_model_id: fields.articleModelId,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update only the user-edited article column. Powers autosave (string value)
 * and restore-to-AI (null). Does not touch article_markdown, so the AI version
 * stays intact for restore.
 */
export async function updatePromptArticleUserEditedMarkdown(
  id: string,
  userEditedArticleMarkdown: string | null,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptArticleRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_ARTICLES)
    .update({ user_edited_article_markdown: userEditedArticleMarkdown })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
