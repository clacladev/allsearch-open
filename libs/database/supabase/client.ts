'use client';

import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );
}

export async function getUser(): Promise<User | undefined> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? undefined;
}

export async function getUserOrThrow(): Promise<User> {
  const user = await getUser();
  if (!user) throw new Error('No user found');
  return user;
}

export async function userSignInWithOTP(email: string, emailRedirectTo: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });
  if (error) throw error;
}

export async function userVerifyWithOTP(email: string, token: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: 'email',
    email,
    token,
  });
  if (error) throw error;
}

export async function userSignInWithGoogle(redirectTo: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function userSignOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
