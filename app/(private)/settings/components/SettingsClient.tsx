'use client';

import { useState } from 'react';
import type { ChatbotId } from '@/libs/database/shared/ChatbotId';
import type { RedactedProviderKey } from '@/libs/database/Settings/types';
import type { ProjectRow } from '@/libs/database/Projects/types';
import type { DatabaseFileInfo } from '@/libs/database/paths';
import { TabList, Tabs } from '@/components/application/tabs/tabs';
import { NativeSelect } from '@/components/base/select/select-native';
import OrganizationSettingsForm from '@/components/settings/OrganizationSettingsForm';
import ProviderKeysSettings from './ProviderKeysSettings';
import ChatbotsSettings from './ChatbotsSettings';
import DataSettings from './DataSettings';
import DeveloperSettings from './DeveloperSettings';

const SETTINGS_TABS = [
  { id: 'provider-keys', label: 'Provider keys' },
  { id: 'chatbots', label: 'Chatbots' },
  { id: 'organization', label: 'Organization' },
  { id: 'data', label: 'Data' },
  { id: 'developer', label: 'Developer' },
] as const;

type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

export default function SettingsClient({
  initialProviderKeys,
  initialEnabledChatbotIds,
  projects,
  databaseFileInfo,
  lastCompletedRunFinishedAt,
}: {
  initialProviderKeys: RedactedProviderKey[];
  initialEnabledChatbotIds: ChatbotId[] | null;
  projects: ProjectRow[];
  databaseFileInfo: DatabaseFileInfo;
  lastCompletedRunFinishedAt: string | null;
}) {
  const [providerKeys, setProviderKeys] = useState(initialProviderKeys);
  const [selectedSettingsTabId, setSelectedSettingsTabId] = useState<SettingsTabId>('provider-keys');

  const onSelectionChange = (tabId: string) => {
    if (SETTINGS_TABS.some((tab) => tab.id === tabId)) {
      setSelectedSettingsTabId(tabId as SettingsTabId);
    }
  };

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <section>
        <NativeSelect
          aria-label="Settings tabs"
          className="md:hidden"
          value={selectedSettingsTabId}
          onChange={(event) => onSelectionChange(event.target.value)}
          options={SETTINGS_TABS.map((tab) => ({ label: tab.label, value: tab.id }))}
        />

        <div className="scrollbar-hide -mx-4 -my-1 flex overflow-auto px-4 py-1 lg:-mx-8 lg:px-8">
          <Tabs
            className="hidden md:flex xl:w-full"
            selectedKey={selectedSettingsTabId}
            onSelectionChange={(value) => onSelectionChange(value as string)}
          >
            <TabList type="button-minimal" className="w-full" items={[...SETTINGS_TABS]} />
          </Tabs>
        </div>
      </section>

      <section>
        {selectedSettingsTabId === 'provider-keys' && (
          <ProviderKeysSettings providerKeys={providerKeys} setProviderKeys={setProviderKeys} />
        )}
        {selectedSettingsTabId === 'chatbots' && (
          <ChatbotsSettings
            providerKeys={providerKeys}
            initialEnabledChatbotIds={initialEnabledChatbotIds}
          />
        )}
        {selectedSettingsTabId === 'organization' && <OrganizationSettingsForm />}
        {selectedSettingsTabId === 'data' && (
          <DataSettings
            databaseFileInfo={databaseFileInfo}
            lastCompletedRunFinishedAt={lastCompletedRunFinishedAt}
          />
        )}
        {selectedSettingsTabId === 'developer' && <DeveloperSettings projects={projects} />}
      </section>
    </div>
  );
}
