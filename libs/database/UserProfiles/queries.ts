import 'server-only';

import { createClient } from '../supabase/serverAsAdmin';
import { UserProfileRow, TABLE_USER_PROFILES } from './types';
import { DEFAULT_QUERY_OPTIONS, QueryOptions } from '../shared/QueryOptions';

export async function getUserProfileRowWithId(
  id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<UserProfileRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_USER_PROFILES)
    .select()
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUserProfileRowWithCustomerId(
  customer_id: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<UserProfileRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_USER_PROFILES)
    .select()
    .eq('customer_id', customer_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUserProfileRowsAll<K extends keyof UserProfileRow>(
  options: QueryOptions & { fields?: K[] } = DEFAULT_QUERY_OPTIONS
): Promise<Pick<UserProfileRow, K>[]> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_USER_PROFILES)
    .select(options.fields ? options.fields.join(', ') : '*');
  if (error) throw error;
  return (data ?? []) as unknown as Pick<UserProfileRow, K>[];
}

export async function getUserProfileRowWithEmail(
  email: string,
  options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<UserProfileRow | undefined> {
  const supabase = await createClient(options.asAdmin);
  const { data, error } = await supabase
    .from(TABLE_USER_PROFILES)
    .select()
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}
