import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SETTINGS_TABS } from './[tabId]/components/helpers';

export const metadata: Metadata = { title: 'Settings' };

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(SETTINGS_TABS[0].getRoute(projectId));
}
