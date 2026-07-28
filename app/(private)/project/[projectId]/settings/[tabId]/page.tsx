import { Metadata } from 'next';
import { MainContainer } from '@/app/(private)/components/Containers';
import Header from '@/app/(private)/components/Header';
import { Settings02 } from '@untitledui/icons';
import Settings from './components/Settings';
import { SETTINGS_TABS } from './components/helpers';
import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ projectId: string; tabId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tabId } = await params;
  const tab = SETTINGS_TABS.find((t) => t.id === tabId);
  return { title: tab?.label ? `Settings | ${tab.label}` : 'Project Settings' };
}

export default async function ProjectSettingsPage({ params }: Props) {
  const { projectId, tabId } = await params;

  const tab = SETTINGS_TABS.find((t) => t.id === tabId);
  if (!tab) redirect(SETTINGS_TABS[0].getRoute(projectId));

  return (
    <MainContainer>
      <Header
        text="Settings"
        icon={Settings02}
        description="Configure your project to control what gets monitored."
      />
      <Settings projectId={projectId} selectedSettingsTabId={tabId} />
    </MainContainer>
  );
}
