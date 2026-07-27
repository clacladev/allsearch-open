import { NextResponse } from 'next/server';
import { createClient } from '@/libs/database/supabase/serverAsAdmin';
import { isDevEnv } from '@/libs/env';

const TEST_EMAIL = 'test@allsearch.io';

export async function GET() {
  if (!isDevEnv) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    const supabase = await createClient(true);
    const { data, error } = await supabase.auth.admin.generateLink({
      email: TEST_EMAIL,
      type: 'magiclink',
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const otp_code = data?.properties?.email_otp;
    if (!otp_code) {
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
    }
    return NextResponse.json({ otp_code });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
