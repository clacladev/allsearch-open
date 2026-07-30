import { Metadata } from 'next';
import { redirect, RedirectType } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import { getProviderKeyFromStorage, getRedactedProviderKeys } from '@/libs/database/Settings/queries';
import KeysForm from './KeysForm';

export const metadata: Metadata = { title: 'Connect an AI Provider' };

export default async function KeysPage() {
  const googleKey = await getProviderKeyFromStorage('google');
  if (googleKey) redirect(ROUTES.ORGANIZATION, RedirectType.replace);

  const providerKeys = await getRedactedProviderKeys();

  return <KeysForm initialProviderKeys={providerKeys} />;
}
