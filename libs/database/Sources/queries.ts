import 'server-only';

import { createClient } from '../supabase/serverAsAdmin';
import { SourceRow, SourceSummaryRow, TABLE_SOURCES } from './types';
import { DEFAULT_QUERY_OPTIONS, QueryOptions } from '../shared/QueryOptions';
import { ISODateString, getISODateString } from '../shared/ISODateString';

const SOURCE_SUMMARY_COLUMNS =
  'id, created_at, project_id, prompt_id, prompt_response_id, is_cited, position, clean_url, url, hostname, title, brand_ids_ranking';

type InsertSourceRowInput = Omit<SourceRow, 'id' | 'created_at'> & { created_at?: string };

export async function insertSourceRows(
  inputs: InsertSourceRowInput[],
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<SourceRow[]> {
  if (!inputs.length) return [];
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase.from(TABLE_SOURCES).insert(inputs).select();
  if (error) throw error;
  return data;
}

export async function getSourceRowsWithPromptResponseIds(
  promptResponseIds: string[],
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<SourceRow[]> {
  if (!promptResponseIds.length) return [];
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_SOURCES)
    .select()
    .in('prompt_response_id', promptResponseIds)
    .order('position', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSourceRowsWithProjectIdInDateRange(
  projectId: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<SourceRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_SOURCES)
    .select()
    .eq('project_id', projectId)
    .gte('created_at', startDateISO)
    .lt('created_at', getISODateString(endDateISO, 1))
    .order('position', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSourceSummaryRowsWithProjectIdInDateRange(
  projectId: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<SourceSummaryRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_SOURCES)
    .select(SOURCE_SUMMARY_COLUMNS)
    .eq('project_id', projectId)
    .gte('created_at', startDateISO)
    .lt('created_at', getISODateString(endDateISO, 1))
    .order('position', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSourceRowsWithProjectId(
  projectId: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<SourceRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_SOURCES)
    .select()
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function deleteSourceRowsWithPromptIds(
  promptIds: string[],
  projectId: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<void> {
  if (!promptIds.length) return;
  const supabase = await createClient(options.asAdmin);
  const { error } = await supabase
    .from(TABLE_SOURCES)
    .delete()
    .in('prompt_id', promptIds)
    .eq('project_id', projectId);
  if (error) throw error;
}

export async function deleteSourceRowsWithProjectId(
  projectId: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<void> {
  const supabase = await createClient(options.asAdmin);
  const { error } = await supabase
    .from(TABLE_SOURCES)
    .delete()
    .eq('project_id', projectId);
  if (error) throw error;
}

export async function deleteSourceRowsWithPromptResponseIds(
  promptResponseIds: string[],
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<void> {
  if (!promptResponseIds.length) return;
  const supabase = await createClient(options.asAdmin);
  const { error } = await supabase
    .from(TABLE_SOURCES)
    .delete()
    .in('prompt_response_id', promptResponseIds);
  if (error) throw error;
}
