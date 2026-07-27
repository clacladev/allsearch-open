import crypto from 'crypto';
import { TABLE_USER_PROFILES } from '@/libs/database/UserProfiles/types';
import { createClient } from '@/libs/database/supabase/serverAsAdmin';
import { PriceKey } from '@/libs/subscriptions';

export function verifyWebhookSignature(body: string, headers: Headers) {
  const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_SIGNING_SECRET!);
  const digest = Buffer.from(hmac.update(body).digest('hex'), 'utf8');
  const signature = Buffer.from(headers.get('x-signature')!, 'utf8');
  if (!crypto.timingSafeEqual(digest, signature)) throw new Error('Invalid signature');
}

export function isValidPriceKey(key: string): key is PriceKey {
  return Object.values(PriceKey).includes(key as PriceKey);
}

// TODO: upgrade the interface to be consistent with other .update() methods
export async function updateUserProfileRowSubscription(
  user_id: string,
  customer_id: string,
  price_id: string,
  price_key: PriceKey,
  scheduled_cancellation: boolean,
  subscribed_at: string
): Promise<void> {
  const supabase = await createClient(true);
  const { error } = await supabase
    .from(TABLE_USER_PROFILES)
    .update({
      customer_id,
      price_id,
      price_key,
      scheduled_cancellation,
      subscribed_at,
    })
    .eq('id', user_id);
  if (error) throw error;
}

export async function updateUserProfileRowSubscriptionExpired(user_id: string): Promise<void> {
  const supabase = await createClient(true);
  const { error } = await supabase
    .from(TABLE_USER_PROFILES)
    .update({
      customer_id: null,
      price_id: null,
      price_key: null,
      scheduled_cancellation: false,
      subscribed_at: null,
    })
    .eq('id', user_id);
  if (error) throw error;
}

export async function updateUserProfileRowSubscriptionIsUnpaid(
  user_id: string,
  is_unpaid: boolean
): Promise<void> {
  const supabase = await createClient(true);
  const { error } = await supabase
    .from(TABLE_USER_PROFILES)
    .update({ is_unpaid })
    .eq('id', user_id);
  if (error) throw error;
}
