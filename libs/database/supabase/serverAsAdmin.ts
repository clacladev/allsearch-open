import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createRegularClient } from './server';

export async function createClient(admin?: boolean) {
  return admin ? createAdminClient() : createRegularClient();
}

async function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}
