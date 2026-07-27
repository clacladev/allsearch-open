import { getUserProfileRowWithId } from '@/libs/database/UserProfiles/queries';
import { createCheckoutUrl } from '@/libs/lemonsqueezy';
import { getPostHogServer } from '@/libs/posthog';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.priceId) {
    return NextResponse.json({ error: 'Price id is required' }, { status: 400 });
  } else if (!body.redirectUrl) {
    return NextResponse.json({ error: 'Redirect URL is required' }, { status: 400 });
  }

  try {
    const { priceId, redirectUrl } = body;
    const user = await getUserOrThrow();
    const userProfile = await getUserProfileRowWithId(user.id);
    if (!userProfile) throw new Error('No user profile found');

    const checkoutUrl = await createCheckoutUrl(
      priceId,
      redirectUrl,
      userProfile.id,
      userProfile.email
    );
    return NextResponse.json({ url: checkoutUrl });
  } catch (e) {
    console.error(e);
    getPostHogServer().captureException(e, await getUserId(), { ...body });
    return NextResponse.json({ error: e instanceof Error ? e.message : e }, { status: 500 });
  }
}
