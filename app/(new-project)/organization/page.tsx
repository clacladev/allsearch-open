import OrganizationForm from './OrganizationForm';
import { getOrganization } from '@/libs/database/Organizations/queries';
import { getProviderKeyFromStorage } from '@/libs/database/Settings/queries';
import { redirect, RedirectType } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your Organization' };

export default async function OrganizationPage() {
  // Keys come first (issue 16): topics, prompts and competitors are all Gemini calls two steps
  // later, so without a Google key the user would hit a confusing AI failure with no obvious
  // cause rather than a clear "add a key" prompt.
  const googleKey = await getProviderKeyFromStorage('google');
  if (!googleKey) redirect(ROUTES.KEYS, RedirectType.replace);

  const organization = await getOrganization();
  if (organization) redirect(ROUTES.NEW_PROJECT.BRAND, RedirectType.replace);

  return <OrganizationForm />;
}
