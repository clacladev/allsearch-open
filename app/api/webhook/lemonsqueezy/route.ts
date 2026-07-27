// See more https://shipfa.st/docs/features/payments

import { getUserId } from '@/libs/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getPostHogServer } from '@/libs/posthog';
import { LemonSqueezyWebhookPayload } from './types';
import { getUserProfileRowWithId } from '@/libs/database/UserProfiles/queries';
import { variantIdToPriceKey } from '@/libs/lemonsqueezy';
import {
  updateUserProfileRowSubscription,
  updateUserProfileRowSubscriptionExpired,
  updateUserProfileRowSubscriptionIsUnpaid,
  verifyWebhookSignature,
} from './helpers';
import { isPreProductionEnv } from '@/libs/env';

export async function POST(req: NextRequest) {
  const body = await req.text();
  verifyWebhookSignature(body, req.headers);

  const payload = JSON.parse(body) as LemonSqueezyWebhookPayload;

  const isTestMode = payload.meta.test_mode;
  if (isTestMode !== isPreProductionEnv) throw new Error('Test mode is invalid');

  const eventName = payload.meta.event_name;
  if (!eventName) throw new Error('Invalid event name');

  const storeId = payload.data.attributes.store_id;
  if (storeId !== Number(process.env.LEMONSQUEEZY_STORE_ID!)) throw new Error('Invalid store id');

  const userId = payload.meta.custom_data.user_id;
  if (!userId) throw new Error('Invalid user id');

  const customerId = payload.data.attributes.customer_id.toString();
  if (!customerId) throw new Error('Invalid customer id');

  const userProfile = await getUserProfileRowWithId(userId);
  if (!userProfile) throw new Error(`No user profile found for userId: ${userId}`);

  try {
    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      // Executes on subscription creation, renewal, plan change, cancellation, resume
      // Note: Executing on both events, becuase on subscription creation, the updated events lands often after 30 seconds
      // while the created event is executed immediately. This way when the user is redicrecte back to the app
      // the subscription is already updated.
      const priceId = payload.data.attributes.variant_id.toString();
      const priceKey = variantIdToPriceKey(priceId);
      const scheduledCancellation = !!payload.data.attributes.ends_at;
      const subscribedAt = payload.data.attributes.created_at;
      await updateUserProfileRowSubscription(
        userId,
        customerId,
        priceId,
        priceKey,
        scheduledCancellation,
        subscribedAt
      );
      console.log(`🍋 LemonSqueezy "${eventName}" event`, {
        userId,
        customerId,
        priceId,
        priceKey,
        scheduledCancellation,
        subscribedAt,
      });
    } else if (eventName === 'subscription_expired') {
      // Subscription expired
      await updateUserProfileRowSubscriptionExpired(userId);
      console.log(`🍋 LemonSqueezy "${eventName}" event`, { userId });
    } else if (eventName === 'subscription_payment_failed') {
      // Failed renewal payments
      await updateUserProfileRowSubscriptionIsUnpaid(userId, true);
      console.log(`🍋 LemonSqueezy "${eventName}" event`, { userId });
    } else if (eventName === 'subscription_payment_recovered') {
      // Recovered failed payments
      await updateUserProfileRowSubscriptionIsUnpaid(userId, false);
      console.log(`🍋 LemonSqueezy "${eventName}" event`, { userId });
    } else {
      // Unhandled events
      console.log(`🍋 LemonSqueezy "${eventName}" event unhandled`, { userId, customerId });
    }
  } catch (e) {
    console.error('LemonSqueezy error:', e instanceof Error ? e.message : e);
    getPostHogServer().captureException(e, await getUserId(), { body });
    return NextResponse.json({ error: e instanceof Error ? e.message : e }, { status: 500 });
  }

  return NextResponse.json({});
}
