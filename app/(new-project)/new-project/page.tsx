import { getUserOrRedirectToSignin } from '@/libs/database/supabase/server';
import { getOrganizationRowWithOwnerId } from '@/libs/database/Organizations/queries';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/libs/routes';

export default async function NewProjectPage() {
  const user = await getUserOrRedirectToSignin();
  const organization = await getOrganizationRowWithOwnerId(user.id);
  if (organization) redirect(ROUTES.NEW_PROJECT.BRAND);
  redirect(ROUTES.ORGANIZATION);
}
