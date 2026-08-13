'use client';

import { useState } from 'react';
import type { ChatbotId } from '@/libs/database/shared/ChatbotId';
import type { RedactedProviderKey } from '@/libs/database/Settings/types';
import type { ProjectRow } from '@/libs/database/Projects/types';
import type { DatabaseFileInfo } from '@/libs/database/paths';
import { NativeSelect } from '@/components/ui/native-select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [selectedSettingsTabId, setSelectedSettingsTabId] =
    useState<SettingsTabId>('provider-keys');

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
        >
          {SETTINGS_TABS.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </NativeSelect>

        <div className="scrollbar-hide -mx-4 -my-1 flex overflow-auto px-4 py-1 lg:-mx-8 lg:px-8">
          <Tabs
            className="hidden md:flex xl:w-full"
            value={selectedSettingsTabId}
            onValueChange={onSelectionChange}
          >
            <TabsList className="border-border w-full justify-start border">
              {SETTINGS_TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex-none px-3">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
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
