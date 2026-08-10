import { Metadata } from 'next';
import { redirect, RedirectType } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import {
  getProviderKeyFromStorage,
  getRedactedProviderKeys,
} from '@/libs/database/Settings/queries';
import KeysForm from './KeysForm';

export const metadata: Metadata = { title: 'Connect an AI Provider' };

export default async function KeysPage({
  searchParams,
}: {
  searchParams: Promise<{ fix?: string }>;
}) {
  const { fix } = await searchParams;
  const isFixMode = fix === '1';
  const googleKey = await getProviderKeyFromStorage('google');
  // Without this carve-out the recovery action on the onboarding AI-failure state is a dead end:
  // a rejected key is still a *stored* key, so this page would bounce straight back into the
  // wizard the user is trying to escape (issue 16, gap 1).
  if (googleKey && !isFixMode) redirect(ROUTES.ORGANIZATION, RedirectType.replace);

  const providerKeys = await getRedactedProviderKeys();

  return <KeysForm initialProviderKeys={providerKeys} isFixMode={isFixMode} />;
}
