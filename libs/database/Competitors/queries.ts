import 'server-only';

import { CompetitorRow, TABLE_COMPETITORS } from './types';
import { DEFAULT_QUERY_OPTIONS, QueryOptions } from '../shared/QueryOptions';
import { createClient } from '../supabase/serverAsAdmin';

type InsertCompetitorRowInput = Omit<
  CompetitorRow,
  'id' | 'is_archived' | 'created_at' | 'updated_at'
> & { created_at?: string };

type UpdateCompetitorRowInput = Partial<Omit<CompetitorRow, 'id' | 'created_at' | 'updated_at'>>;

export async function getCompetitorRowWithId(
  id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<CompetitorRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const query = supabase.from(TABLE_COMPETITORS).select().eq('id', id);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCompetitorRowsWithProjectId(
  project_id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<CompetitorRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_COMPETITORS)
    .select()
    .eq('project_id', project_id)
    .order('updated_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getActiveCompetitorRowsWithProjectId(
  project_id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<CompetitorRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_COMPETITORS)
    .select()
    .eq('project_id', project_id)
    .eq('is_archived', false)
    .order('updated_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCompetitorRowsWithOrganizationId(
  organization_id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<CompetitorRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_COMPETITORS)
    .select()
    .eq('organization_id', organization_id)
    .order('updated_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertCompetitorRow(
  input: InsertCompetitorRowInput,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<CompetitorRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase.from(TABLE_COMPETITORS).insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function insertCompetitorRows(
  inputs: InsertCompetitorRowInput[],
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<CompetitorRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase.from(TABLE_COMPETITORS).insert(inputs).select();
  if (error) throw error;
  return data;
}

export async function updateCompetitorRowWithId(
  id: string,
  values: UpdateCompetitorRowInput,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<CompetitorRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_COMPETITORS)
    .update(values)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
