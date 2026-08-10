import { getOrganization } from '@/libs/database/Organizations/queries';
import { getProviderKeyFromStorage } from '@/libs/database/Settings/queries';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import ResumeDraft from './components/ResumeDraft';

export default async function NewProjectPage() {
  // Keys come first (issue 16): topics, prompts and competitors are all Gemini calls two steps
  // later, so without a Google key the user would hit a confusing AI failure with no obvious
  // cause rather than a clear "add a key" prompt.
  const googleKey = await getProviderKeyFromStorage('google');
  if (!googleKey) redirect(ROUTES.KEYS);

  const organization = await getOrganization();
  if (!organization) redirect(ROUTES.ORGANIZATION);
  // The draft lives in localStorage, so which step to resume on can only be decided on the client.
  return <ResumeDraft />;
}
