'use server';
import { ROUTES } from '@/libs/routes';

import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isProdEnv } from '@/libs/env';

export async function createRegularClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function getUser(): Promise<User | undefined> {
  const supabase = await createRegularClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? undefined;
}

export async function getUserId(): Promise<string | undefined> {
  const user = await getUser();
  return user?.id;
}

export async function getUserOrThrow(): Promise<User> {
  const user = await getUser();
  if (!user) throw new Error('No user found');
  return user;
}

// TODO(issue 06): there is no user and no sign-in page. This whole function
// goes when the user is removed from the application layer; until then it sends
// callers home rather than to a route that no longer exists.
export async function getUserOrRedirectToSignin(): Promise<User> {
  const user = await getUser();
  if (!user) redirect(ROUTES.HOME);
  return user;
}

export async function getUserSessionId() {
  const cookiesStore = await cookies();
  return cookiesStore.get('sessionId')?.value;
}

export async function getOrCreateUserSessionId() {
  let sessionId = await getUserSessionId();

  if (!sessionId) {
    // sessionId = randomUUID();
    sessionId = crypto.randomUUID();
    await setUserSessionId(sessionId);
  }

  return sessionId;
}

export async function setUserSessionId(sessionId: string) {
  const cookiesStore = await cookies();
  cookiesStore.set('sessionId', sessionId, {
    expires: new Date(Date.now() + 1 * (24 * 60 * 60 * 1000)), // 1 day
    httpOnly: true,
    secure: isProdEnv,
    sameSite: 'lax',
  });
}
