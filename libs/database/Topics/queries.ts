import 'server-only';

import { createClient } from '../supabase/serverAsAdmin';
import { TopicRow, TABLE_TOPICS } from './types';
import { QueryOptions, DEFAULT_QUERY_OPTIONS } from '../shared/QueryOptions';

type InsertTopicRowInput = Omit<TopicRow, 'id' | 'is_archived' | 'created_at' | 'updated_at'> & {
  created_at?: string;
};

export async function getTopicRowWithId(
  id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<TopicRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const query = supabase.from(TABLE_TOPICS).select().eq('id', id);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function getTopicRowsWithProjectId(
  project_id: string,
  options: QueryOptions & { includeArchived?: boolean } = DEFAULT_QUERY_OPTIONS
): Promise<TopicRow[]> {
  const supabase = await createClient(options.asAdmin);
  let query = supabase.from(TABLE_TOPICS).select().eq('project_id', project_id);
  if (!options.includeArchived) query = query.eq('is_archived', false);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function insertTopicRow(
  input: InsertTopicRowInput,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<TopicRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase.from(TABLE_TOPICS).insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTopicRow(
  id: string,
  input: Partial<Pick<TopicRow, 'name' | 'is_archived'>>,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<TopicRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_TOPICS)
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertTopicRows(
  inputs: InsertTopicRowInput[],
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<TopicRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase.from(TABLE_TOPICS).insert(inputs).select();
  if (error) throw error;
  return data;
}

export async function deleteTopicRowsWithProjectId(
  projectId: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<TopicRow[] | undefined> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_TOPICS)
    .delete()
    .eq('project_id', projectId)
    .select();
  if (error) throw error;
  return data;
}
