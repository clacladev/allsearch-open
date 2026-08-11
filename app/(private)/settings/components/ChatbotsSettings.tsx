'use client';

import { useState, useTransition } from 'react';
import { CheckboxGroup } from '@/components/base/checkbox/checkbox-group';
import type { RadioGroupItemType } from '@/components/base/radio-groups/radio-group-radio-button';
import SettingsFormHeader from '@/components/settings/SettingsFormHeader';
import { showErrorAlertToast } from '@/components/Alerts';
import { appFetch } from '@/hooks/appFetch';
import { ROUTES } from '@/libs/routes';
import {
  CHATBOT_DISPLAY_LABELS,
  CHATBOT_PROVIDER,
  ChatbotId,
  SUPPORTED_CHATBOTS_IDS,
} from '@/libs/database/shared/ChatbotId';
import type { ProviderId } from '@/libs/database/shared/ProviderId';
import type { RedactedProviderKey } from '@/libs/database/Settings/types';
import type { SetEnabledChatbotIdsResponse } from '@/app/api/settings/chatbots/types';

const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: 'OpenAI',
  google: 'Google',
  perplexity: 'Perplexity',
};

export default function ChatbotsSettings({
  providerKeys,
  initialEnabledChatbotIds,
}: {
  providerKeys: RedactedProviderKey[];
  initialEnabledChatbotIds: ChatbotId[] | null;
}) {
  // `null` means the user has never touched this setting — it stays `null` in storage (and keeps
  // tracking whichever providers currently have a key) until the first explicit toggle below, at
  // which point it becomes a concrete array and stops auto-following new keys. See
  // `getEffectiveEnabledChatbotIds` (libs/database/Settings/queries.ts) for the read-side half of
  // this contract.
  const [rawIds, setRawIds] = useState<ChatbotId[] | null>(initialEnabledChatbotIds);
  const [isSaving, startSaving] = useTransition();

  const hasKey = (chatbotId: ChatbotId) =>
    providerKeys.some((key) => key.provider === CHATBOT_PROVIDER[chatbotId]);

  const defaultIds = SUPPORTED_CHATBOTS_IDS.filter(hasKey);
  const enabledIds = rawIds ?? defaultIds;

  const items: RadioGroupItemType[] = SUPPORTED_CHATBOTS_IDS.map((chatbotId) => ({
    value: chatbotId,
    title: CHATBOT_DISPLAY_LABELS[chatbotId],
    disabled: !hasKey(chatbotId),
    description: hasKey(chatbotId)
      ? undefined
      : `Needs a ${PROVIDER_LABELS[CHATBOT_PROVIDER[chatbotId]]} key to unlock.`,
  }));

  const onChange = (newIds: string[]) => {
    const ids = newIds as ChatbotId[];
    setRawIds(ids);
    startSaving(async () => {
      try {
        await appFetch<SetEnabledChatbotIdsResponse>(ROUTES.API.SETTINGS.CHATBOTS, {
          method: 'PATCH',
          body: JSON.stringify({ chatbotIds: ids }),
        });
      } catch (error) {
        showErrorAlertToast(
          'Failed to save Chatbot selection',
          error instanceof Error ? error.message : 'Something went wrong'
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <SettingsFormHeader
        title="Chatbots"
        description="Which Chatbots run in the next Collection Run. Disabling one excludes it from the run, and Visibility figures only cover the Chatbots that produced them."
      />

      <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

      <CheckboxGroup
        aria-label="Chatbots"
        items={items}
        value={enabledIds}
        onChange={onChange}
        isDisabled={isSaving}
      />
    </div>
  );
}
