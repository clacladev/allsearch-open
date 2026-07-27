import 'server-only';

import { createClient } from '../supabase/serverAsAdmin';
import { ProjectRow, TABLE_PROJECTS } from './types';
import { QueryOptions, DEFAULT_QUERY_OPTIONS } from '../shared/QueryOptions';

type InsertProjectRowInput = Omit<
  ProjectRow,
  'id' | 'created_at' | 'updated_at' | 'is_paused' | 'is_archived' | 'prompts_updated_at'
>;
type UpdateProjectRowInput = Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'>;

export async function getProjectRowWithId(
  id: string,
  author_id?: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<ProjectRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  let query = supabase.from(TABLE_PROJECTS).select().eq('id', id);
  if (author_id) {
    query = query.eq('author_id', author_id);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProjectsRowsWithOrganizationId(
  organization_id: string,
  includeArchived = false,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<ProjectRow[]> {
  const supabase = await createClient(options.asAdmin);
  let query = supabase.from(TABLE_PROJECTS).select().eq('organization_id', organization_id);
  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }
  const { data, error } = await query.order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function getProjectRowsAll<K extends keyof ProjectRow>(
  includeArchived = false,
  options: QueryOptions & { fields?: K[] } = DEFAULT_QUERY_OPTIONS
): Promise<Pick<ProjectRow, K>[]> {
  const supabase = await createClient(options.asAdmin);
  let query = supabase.from(TABLE_PROJECTS).select();
  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }
  const { data, error } = await query
    .select(options.fields ? options.fields.join(', ') : '*')
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as unknown as Pick<ProjectRow, K>[];
}

export async function insertProjectRow(
  input: InsertProjectRowInput,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<ProjectRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase.from(TABLE_PROJECTS).insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateProjectRow(
  id: string,
  values: Partial<UpdateProjectRowInput>,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<ProjectRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROJECTS)
    .update(values)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProjectRow(
  id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<void> {
  const supabase = await createClient(options.asAdmin);
  const { error } = await supabase.from(TABLE_PROJECTS).delete().eq('id', id);
  if (error) throw error;
}

export async function deleteProjectRowCascade(
  id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<void> {
  const supabase = await createClient(options.asAdmin);
  const { error } = await supabase.rpc('delete_project_cascade', { target_project_id: id });
  if (error) throw error;
}
