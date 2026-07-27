import { Content } from './Content';
import { getUser } from '@/libs/database/supabase/server';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import { getSEOTags } from '@/libs/seo';
import { config } from '@/config';
import { Metadata } from 'next';
import PublicShell from '../(public)/components/PublicShell';

export const metadata: Metadata = getSEOTags({
  title: `Signin to ${config.appName}`,
  description: `Signin to ${config.appName}`,
});

export default async function SigninPage() {
  const user = await getUser();
  if (user) redirect(ROUTES.DASHBOARD);
  return (
    <PublicShell stripLinksFromHeaderAndFooter stripCtaFromHeader>
      <Content />
    </PublicShell>
  );
}
