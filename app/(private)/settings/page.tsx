import { Metadata } from 'next';
import { MainContainer } from '@/app/(private)/components/Containers';
import Header from '@/app/(private)/components/Header';
import { Settings02 } from '@untitledui/icons';
import {
  getRedactedProviderKeys,
  getStoredEnabledChatbotIds,
} from '@/libs/database/Settings/queries';
import { getProjectRows } from '@/libs/database/Projects/queries';
import { getCollectionCadenceAnchor } from '@/libs/database/CollectionRuns/queries';
import { getDatabaseFileInfo } from '@/libs/database/paths';
import SettingsClient from './components/SettingsClient';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  // Archived Projects are included deliberately: the Developer section is the only place they can
  // be restored or deleted from, so leaving them out would strand them.
  const [providerKeys, enabledChatbotIds, projects, cadenceAnchor] = await Promise.all([
    getRedactedProviderKeys(),
    getStoredEnabledChatbotIds(),
    getProjectRows(true),
    getCollectionCadenceAnchor(),
  ]);

  return (
    <MainContainer>
      <Header
        text="Settings"
        icon={Settings02}
        description="Provider keys, Chatbots, your Organization and where this install keeps its data."
      />
      <SettingsClient
        initialProviderKeys={providerKeys}
        initialEnabledChatbotIds={enabledChatbotIds}
        projects={projects}
        databaseFileInfo={getDatabaseFileInfo()}
        lastCompletedRunFinishedAt={cadenceAnchor?.finishedAt ?? null}
      />
    </MainContainer>
  );
}
