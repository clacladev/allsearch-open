import { PriceKey } from '@/libs/subscriptions';

export const TABLE_USER_PROFILES = 'user_profiles';

export type UserRole = 'user' | 'admin';

export type UserProfileRow = {
  id: string;
  email: string;
  customer_id: string | null;
  price_id: string | null;
  price_key: PriceKey | null;
  is_unpaid: boolean;
  scheduled_cancellation: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
  subscribed_at: string | null;
};
