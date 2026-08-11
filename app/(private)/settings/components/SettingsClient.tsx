'use client';

import { useState } from 'react';
import type { ChatbotId } from '@/libs/database/shared/ChatbotId';
import type { RedactedProviderKey } from '@/libs/database/Settings/types';
import type { ProjectRow } from '@/libs/database/Projects/types';
import type { DatabaseFileInfo } from '@/libs/database/paths';
import OrganizationSettingsForm from '@/components/settings/OrganizationSettingsForm';
import ProviderKeysSettings from './ProviderKeysSettings';
import ChatbotsSettings from './ChatbotsSettings';
import DataSettings from './DataSettings';
import DeveloperSettings from './DeveloperSettings';

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

  return (
    <div className="flex max-w-4xl flex-col gap-12">
      <ProviderKeysSettings providerKeys={providerKeys} setProviderKeys={setProviderKeys} />
      <ChatbotsSettings
        providerKeys={providerKeys}
        initialEnabledChatbotIds={initialEnabledChatbotIds}
      />
      <OrganizationSettingsForm />
      <DataSettings
        databaseFileInfo={databaseFileInfo}
        lastCompletedRunFinishedAt={lastCompletedRunFinishedAt}
      />
      <DeveloperSettings projects={projects} />
    </div>
  );
}
