import 'server-only';

import { createClient } from '../supabase/serverAsAdmin';
import { OrganizationRow, TABLE_ORGANIZATIONS } from './types';
import { DEFAULT_QUERY_OPTIONS, QueryOptions } from '../shared/QueryOptions';

type InsertOrganizationRowInput = Omit<OrganizationRow, 'id' | 'created_at' | 'updated_at'>;

export async function getOrganizationRowWithId(
  id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<OrganizationRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_ORGANIZATIONS)
    .select()
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getOrganizationRowWithOwnerId(
  owner_id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<OrganizationRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_ORGANIZATIONS)
    .select()
    .eq('owner_id', owner_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertOrganizationRow(
  input: InsertOrganizationRowInput,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<OrganizationRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase.from(TABLE_ORGANIZATIONS).insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateOrganizationRow(
  id: string,
  values: Partial<InsertOrganizationRowInput>,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<OrganizationRow> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_ORGANIZATIONS)
    .update(values)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
