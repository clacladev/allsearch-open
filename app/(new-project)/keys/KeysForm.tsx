'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import { ProviderKeyField } from '@/app/components/ProviderKeyField';
import FormHeader from '../new-project/components/FormHeader';
import { NewProjectLayoutColumn } from '../layout';
import type { RedactedProviderKey } from '@/libs/database/Settings/types';

export default function KeysForm({
  initialProviderKeys,
  isFixMode,
}: {
  initialProviderKeys: RedactedProviderKey[];
  isFixMode?: boolean;
}) {
  const router = useRouter();
  const [providerKeys, setProviderKeys] = useState(initialProviderKeys);

  const findKey = (provider: 'google' | 'openai' | 'perplexity') =>
    providerKeys.find((key) => key.provider === provider);

  return (
    <NewProjectLayoutColumn>
      <div className="flex flex-col gap-5">
        <FormHeader
          title={isFixMode ? 'Fix your API key' : 'Connect an AI provider'}
          description={
            isFixMode
              ? 'Your Google key was rejected or is rate limited. Replace it below and we will drop you back where you left off.'
              : 'Google is required — it alone powers Chatbot answers, sentiment, topic and prompt ideas, competitor discovery, and article generation.'
          }
        />

        <div className="flex flex-col gap-2">
          <ProviderKeyField
            provider="google"
            storedKey={findKey('google')}
            onChange={setProviderKeys}
            onSaved={() => router.push(isFixMode ? ROUTES.NEW_PROJECT.INDEX : ROUTES.ORGANIZATION)}
          />
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-brand-secondary self-start text-sm underline"
          >
            Get a Google API key
          </a>
        </div>

        <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

        <div className="flex flex-col gap-1">
          <p className="text-secondary text-sm font-medium">Track another AI platform</p>
          <p className="text-tertiary text-sm">
            Optional — each one unlocks exactly one more Chatbot. Add now, or later in Settings.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-secondary text-sm font-medium">OpenAI</span>
          <ProviderKeyField
            provider="openai"
            storedKey={findKey('openai')}
            onChange={setProviderKeys}
            size="sm"
          />
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-brand-secondary self-start text-sm underline"
          >
            Get an OpenAI API key
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-secondary text-sm font-medium">Perplexity</span>
          <ProviderKeyField
            provider="perplexity"
            storedKey={findKey('perplexity')}
            onChange={setProviderKeys}
            size="sm"
          />
          <a
            href="https://www.perplexity.ai/settings/api"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-brand-secondary self-start text-sm underline"
          >
            Get a Perplexity API key
          </a>
        </div>
      </div>
    </NewProjectLayoutColumn>
  );
}
