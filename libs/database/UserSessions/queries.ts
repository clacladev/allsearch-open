import 'server-only';

import { createClient } from '../supabase/serverAsAdmin';
import { UserSessionInfoRow } from './types';

export async function getUserSessionInfoRow(
  userId: string
): Promise<UserSessionInfoRow | undefined> {
  const supabase = await createClient(true);
  const { data, error } = await supabase.rpc('get_user_session_info', {
    target_user_id: userId,
  });
  if (error) throw error;
  const rows = (data ?? []) as UserSessionInfoRow[];
  return rows[0];
}

export async function getUserSessionInfoRows(userIds: string[]): Promise<UserSessionInfoRow[]> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return [];
  const supabase = await createClient(true);
  const { data, error } = await supabase.rpc('get_user_session_info_bulk', {
    target_user_ids: unique,
  });
  if (error) throw error;
  return (data ?? []) as UserSessionInfoRow[];
}
