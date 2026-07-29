import OrganizationForm from './OrganizationForm';
import { getOrganization } from '@/libs/database/Organizations/queries';
import { redirect, RedirectType } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your Organization' };

export default async function OrganizationPage() {
  const organization = await getOrganization();
  if (organization) redirect(ROUTES.NEW_PROJECT.BRAND, RedirectType.replace);

  return <OrganizationForm />;
}
