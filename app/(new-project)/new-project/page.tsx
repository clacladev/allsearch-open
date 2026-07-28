import { getOrganization } from '@/libs/database/Organizations/queries';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/libs/routes';

export default async function NewProjectPage() {
  const organization = await getOrganization();
  if (organization) redirect(ROUTES.NEW_PROJECT.BRAND);
  redirect(ROUTES.ORGANIZATION);
}
