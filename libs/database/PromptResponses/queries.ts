import 'server-only';

import { createClient } from '../supabase/serverAsAdmin';
import { PromptResponseRow, PromptResponseSummaryRow, TABLE_PROMPT_RESPONSES } from './types';
import { DEFAULT_QUERY_OPTIONS, QueryOptions } from '../shared/QueryOptions';
import { ISODateString, getISODateString } from '../shared/ISODateString';
import {
  deleteSourceRowsWithPromptIds,
  deleteSourceRowsWithProjectId,
} from '../Sources/queries';

type InsertPromptResponseRowInput = Omit<PromptResponseRow, 'id' | 'created_at'> & {
  created_at?: string;
};

export async function getPromptResponseRowWithId(
  id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptResponseRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_RESPONSES)
    .select()
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPromptResponseRowsWithProjectIdInDateRange(
  project_id: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptResponseRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_RESPONSES)
    .select()
    .eq('project_id', project_id)
    .gte('created_at', startDateISO)
    .lt('created_at', getISODateString(endDateISO, 1)) // Add a day to include the full endDate day in the range
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

const SUMMARY_COLUMNS =
  'id, brand_ids_ranking, sentiment, chatbot_id, prompt_id, created_at' as const;

export async function getPromptResponseSummaryRowsWithProjectIdInDateRange(
  project_id: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptResponseSummaryRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_RESPONSES)
    .select(SUMMARY_COLUMNS)
    .eq('project_id', project_id)
    .gte('created_at', startDateISO)
    .lt('created_at', getISODateString(endDateISO, 1))
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPromptResponseRowsWithPromptIdInDateRange(
  prompt_id: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptResponseRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_RESPONSES)
    .select()
    .eq('prompt_id', prompt_id)
    .gte('created_at', startDateISO)
    .lt('created_at', getISODateString(endDateISO, 1)) // Add a day to include the full endDate day in the range
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPromptResponseRowsWithProjectId(
  project_id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptResponseRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_RESPONSES)
    .select()
    .eq('project_id', project_id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function insertPromptResponseRow(
  input: InsertPromptResponseRowInput,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptResponseRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_RESPONSES)
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertPromptResponseRows(
  inputs: InsertPromptResponseRowInput[],
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptResponseRow[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase.from(TABLE_PROMPT_RESPONSES).insert(inputs).select();
  if (error) throw error;
  return data;
}

export async function updatePromptResponseRowWithId(
  id: string,
  values: Partial<InsertPromptResponseRowInput>,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptResponseRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_RESPONSES)
    .update(values)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePromptResponseRowsWithPromptIds(
  promptIds: string[],
  projectId: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptResponseRow[] | undefined> {
  // Delete from sources first (FK constraint)
  await deleteSourceRowsWithPromptIds(promptIds, projectId, options);

  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_RESPONSES)
    .delete()
    .in('prompt_id', promptIds)
    .eq('project_id', projectId)
    .select();
  if (error) throw error;
  return data;
}

export async function deletePromptResponseRowsWithProjectId(
  projectId: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<PromptResponseRow[] | undefined> {
  // Delete from sources first (FK constraint)
  await deleteSourceRowsWithProjectId(projectId, options);

  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_PROMPT_RESPONSES)
    .delete()
    .eq('project_id', projectId)
    .select();
  if (error) throw error;
  return data;
}
