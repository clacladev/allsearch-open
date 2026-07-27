import OrganizationForm from './OrganizationForm';
import { getUserOrRedirectToSignin } from '@/libs/database/supabase/server';
import { getOrganizationRowWithOwnerId } from '@/libs/database/Organizations/queries';
import { redirect, RedirectType } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your Organization' };

export default async function OrganizationPage() {
  const user = await getUserOrRedirectToSignin();
  const organization = await getOrganizationRowWithOwnerId(user.id);
  if (organization) redirect(ROUTES.NEW_PROJECT.BRAND, RedirectType.replace);

  return <OrganizationForm />;
}
