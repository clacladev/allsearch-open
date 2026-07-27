import 'server-only';

import { createClient } from '../supabase/serverAsAdmin';
import { PromptAndTopicJoinRow, PromptRow, TABLE_PROMPTS } from './types';
import { DEFAULT_QUERY_OPTIONS, QueryOptions } from '../shared/QueryOptions';

type InsertPromptRowInput = Omit<PromptRow, 'id' | 'is_archived' | 'created_at' | 'updated_at'> & {
  created_at?: string;
};

type UpdatePromptRowInput = Partial<Omit<PromptRow, 'id' | 'created_at' | 'updated_at'>>;

export async function getPromptRowWithId(
  id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const query = supabase.from(TABLE_PROMPTS).select().eq('id', id);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPromptRowsWithProjectId(
  project_id: string,
  includeArchived = false,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptRow[]> {
  const supabase = await createClient(options.asAdmin);
  let query = supabase
    .from(TABLE_PROMPTS)
    .select()
    .eq('project_id', project_id)
    .order('updated_at', { ascending: true });
  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getPromptRowsWithOrganizationId(
  organization_id: string,
  includeArchived = false,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptRow[]> {
  const supabase = await createClient(options.asAdmin);
  let query = supabase
    .from(TABLE_PROMPTS)
    .select()
    .eq('organization_id', organization_id)
    .order('updated_at', { ascending: true });
  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getPromptAndTopicJoinWithProjectId(
  project_id: string,
  includeArchived = false,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptAndTopicJoinRow[]> {
  const supabase = await createClient(options.asAdmin);
  let query = supabase
    .from(TABLE_PROMPTS)
    .select('*, topics(name)')
    .eq('project_id', project_id);
  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }
  const { data, error } = await query
    .order('created_at', { ascending: true })
    .order('is_archived', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    topic_name: row.topics?.name ?? null,
    topics: undefined,
  })) as PromptAndTopicJoinRow[];
}

export async function insertPromptRow(
  input: InsertPromptRowInput,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase.from(TABLE_PROMPTS).insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function insertPromptRows(
  inputs: InsertPromptRowInput[],
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase.from(TABLE_PROMPTS).insert(inputs).select();
  if (error) throw error;
  return data;
}

export async function updatePromptRowWithId(
  id: string,
  values: UpdatePromptRowInput,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPTS)
    .update(values)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePromptRowsWithProjectId(
  projectId: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptRow[] | undefined> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPTS)
    .delete()
    .eq('project_id', projectId)
    .select();
  if (error) throw error;
  return data;
}
