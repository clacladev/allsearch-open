'use client';

import { useState } from 'react';
import type { ChatbotId } from '@/libs/database/shared/ChatbotId';
import type { RedactedProviderKey } from '@/libs/database/Settings/types';
import ProviderKeysSettings from './ProviderKeysSettings';
import ChatbotsSettings from './ChatbotsSettings';

export default function SettingsClient({
  initialProviderKeys,
  initialEnabledChatbotIds,
}: {
  initialProviderKeys: RedactedProviderKey[];
  initialEnabledChatbotIds: ChatbotId[] | null;
}) {
  const [providerKeys, setProviderKeys] = useState(initialProviderKeys);

  return (
    <div className="flex max-w-2xl flex-col gap-12">
      <ProviderKeysSettings providerKeys={providerKeys} setProviderKeys={setProviderKeys} />
      <ChatbotsSettings
        providerKeys={providerKeys}
        initialEnabledChatbotIds={initialEnabledChatbotIds}
      />
    </div>
  );
}
