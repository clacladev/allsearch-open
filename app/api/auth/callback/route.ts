import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/libs/database/supabase/serverAsAdmin';
import { config } from '@/config';

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(req.nextUrl.origin + config.auth.callbackUrl);
}
