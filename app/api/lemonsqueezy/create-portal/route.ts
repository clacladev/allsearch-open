import { NextResponse } from 'next/server';
import { createCustomerPortalUrl } from '@/libs/lemonsqueezy';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import { getUserProfileRowWithId } from '@/libs/database/UserProfiles/queries';
import { getPostHogServer } from '@/libs/posthog';

export async function POST() {
  try {
    const user = await getUserOrThrow();
    const userProfile = await getUserProfileRowWithId(user.id);
    if (!userProfile) throw new Error('No user profile found');
    if (!userProfile.customer_id) throw new Error("You don't have a billing account yet");

    const portalUrl = await createCustomerPortalUrl(userProfile.customer_id);
    return NextResponse.json({ url: portalUrl });
  } catch (e) {
    console.error(e);
    getPostHogServer().captureException(e, await getUserId(), {});
    return NextResponse.json({ error: e instanceof Error ? e.message : e }, { status: 500 });
  }
}
