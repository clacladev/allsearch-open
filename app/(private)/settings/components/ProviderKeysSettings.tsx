import SettingsSectionLabel from './SettingsSectionLabel';
import SettingsFormHeader from '@/components/settings/SettingsFormHeader';
import { ProviderKeyField } from '@/app/components/ProviderKeyField';
import type { ProviderId } from '@/libs/database/shared/ProviderId';
import type { RedactedProviderKey } from '@/libs/database/Settings/types';

// Google is required — it alone yields a fully working product (it powers the Google AI Overview
// Chatbot *and* sentiment, topic ideas, prompt ideas, competitor discovery, article outlines and
// article generation). OpenAI and Perplexity are optional and each unlock exactly one further
// Chatbot (ADR 0004, issue 08) — the copy and ordering below reflect that asymmetry rather than
// presenting three equal empty boxes.
const PROVIDER_ROWS: {
  provider: ProviderId;
  title: string;
  isRequired: boolean;
  description: string;
  keysUrl: string;
}[] = [
  {
    provider: 'google',
    title: 'Google',
    isRequired: true,
    description:
      'Powers the Google AI Overview Chatbot, sentiment, topic ideas, prompt ideas, competitor discovery, article outlines and article generation. Without it, the app has nothing to run on.',
    keysUrl: 'https://aistudio.google.com/apikey',
  },
  {
    provider: 'openai',
    title: 'OpenAI',
    isRequired: false,
    description: 'Optional — unlocks the ChatGPT Chatbot.',
    keysUrl: 'https://platform.openai.com/api-keys',
  },
  {
    provider: 'perplexity',
    title: 'Perplexity',
    isRequired: false,
    description: 'Optional — unlocks the Perplexity Chatbot.',
    keysUrl: 'https://www.perplexity.ai/settings/api',
  },
];

export default function ProviderKeysSettings({
  providerKeys,
  setProviderKeys,
}: {
  providerKeys: RedactedProviderKey[];
  setProviderKeys: (providerKeys: RedactedProviderKey[]) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <SettingsFormHeader
        title="Provider keys"
        description="Direct API keys for the AI providers this app calls on your behalf — never routed through us."
      />

      <hr className="bg-border h-px w-full border-none" aria-hidden="true" />

      {PROVIDER_ROWS.map((row, index) => (
        <div key={row.provider}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-12">
            <SettingsSectionLabel
              title={row.title}
              isRequired={row.isRequired}
              description={
                <>
                  {row.description}{' '}
                  <a
                    href={row.keysUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-brand-secondary underline"
                  >
                    Get a {row.title} key
                  </a>
                </>
              }
            />

            <div className="w-full max-w-sm">
              <ProviderKeyField
                provider={row.provider}
                storedKey={providerKeys.find((key) => key.provider === row.provider)}
                onChange={setProviderKeys}
              />
            </div>
          </div>

          {index < PROVIDER_ROWS.length - 1 && (
            <hr className="bg-border mt-4 h-px w-full border-none" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}
