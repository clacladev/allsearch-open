import { Metadata } from 'next';
import { MainContainer } from '@/app/(private)/components/Containers';
import Header from '@/app/(private)/components/Header';
import { Settings02 } from '@untitledui/icons';
import {
  getRedactedProviderKeys,
  getStoredEnabledChatbotIds,
} from '@/libs/database/Settings/queries';
import SettingsClient from './components/SettingsClient';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const [providerKeys, enabledChatbotIds] = await Promise.all([
    getRedactedProviderKeys(),
    getStoredEnabledChatbotIds(),
  ]);

  return (
    <MainContainer>
      <Header
        text="Settings"
        icon={Settings02}
        description="Provider keys and Chatbots for this install."
      />
      <SettingsClient
        initialProviderKeys={providerKeys}
        initialEnabledChatbotIds={enabledChatbotIds}
      />
    </MainContainer>
  );
}
