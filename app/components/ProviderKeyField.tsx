'use client';

// Lives at app/components/ rather than app/(private)/components/ because it's used from both the
// (private) settings screen and the (new-project) onboarding keys step — sibling route groups
// can't reach into one another, and this folder (no page.tsx) is a plain shared location both can
// import from (see app/components/AiFailureState.tsx for the same reasoning).

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { appFetch } from '@/hooks/appFetch';
import { ROUTES } from '@/libs/routes';
import type { ProviderId } from '@/libs/database/shared/ProviderId';
import type { ProviderKeyStatus, RedactedProviderKey } from '@/libs/database/Settings/types';
import type {
  RemoveProviderKeyResponse,
  SetProviderKeyResponse,
} from '@/app/api/settings/provider-keys/types';

const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: 'OpenAI',
  google: 'Google',
  perplexity: 'Perplexity',
};

const STATUS_BADGE: Record<ProviderKeyStatus, { color: 'success' | 'warning'; label: string }> = {
  valid: { color: 'success', label: 'Verified' },
  unverified: { color: 'warning', label: 'Unverified' },
  rate_limited: { color: 'warning', label: 'Rate limited' },
};

/** Only shown for statuses that differ from a plain working key — a `valid` key needs no caveat. */
const STATUS_HINT: Partial<Record<ProviderKeyStatus, string>> = {
  unverified: 'Saved without being checked — the first real use will confirm whether it works.',
  rate_limited: 'This key works, but the provider is rate limiting it right now.',
};

/**
 * Add/replace/remove UI for a single provider key. Never handles the raw key beyond the input
 * field the user is actively typing into and the single POST request that submits it — every
 * other piece of state it holds (`storedKey`) is already redacted to the last four characters by
 * `getRedactedProviderKeys()`, and the component never logs or re-displays what the user typed.
 */
export function ProviderKeyField({
  provider,
  storedKey,
  onChange,
  onSaved,
}: {
  provider: ProviderId;
  storedKey: RedactedProviderKey | undefined;
  /** Called with the fresh, redacted key list after any successful save or remove. */
  onChange: (providerKeys: RedactedProviderKey[]) => void;
  /** Called only after a successful save — e.g. to auto-advance onboarding. */
  onSaved?: (providerKeys: RedactedProviderKey[]) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [keyValue, setKeyValue] = useState('');
  const [isSaving, startSaving] = useTransition();
  const [isRemoving, startRemoving] = useTransition();

  const label = PROVIDER_LABELS[provider];
  const showInput = isEditing || !storedKey;

  const onSave = () => {
    const key = keyValue.trim();
    if (!key || isSaving) return;
    startSaving(async () => {
      try {
        const response = await appFetch<SetProviderKeyResponse>(
          ROUTES.API.SETTINGS.PROVIDER_KEYS,
          { method: 'POST', body: JSON.stringify({ provider, key }) },
          `Failed to save the ${label} key`
        );
        setKeyValue('');
        setIsEditing(false);
        onChange(response.providerKeys);
        showSuccessAlertToast(`${label} key saved`, response.message);
        onSaved?.(response.providerKeys);
      } catch (error) {
        showErrorAlertToast(
          `${label} key rejected`,
          error instanceof Error ? error.message : 'Something went wrong'
        );
      }
    });
  };

  const onRemove = () => {
    startRemoving(async () => {
      try {
        const response = await appFetch<RemoveProviderKeyResponse>(
          ROUTES.API.SETTINGS.PROVIDER_KEYS,
          { method: 'DELETE', body: JSON.stringify({ provider }) },
          `Failed to remove the ${label} key`
        );
        onChange(response.providerKeys);
        setIsEditing(true);
        showSuccessAlertToast(`${label} key removed`, 'The key has been removed.');
      } catch (error) {
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    onSave();
  };

  if (showInput) {
    return (
      <div className="flex flex-col gap-2">
        <Input
          value={keyValue}
          onChange={(event) => setKeyValue(event.target.value)}
          onKeyDown={onKeyDown}
          type="password"
          aria-label={`${label} API key`}
          placeholder={`Paste your ${label} key`}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={!keyValue.trim().length || isSaving}>
            Save
          </Button>
          {storedKey && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={() => {
                setIsEditing(false);
                setKeyValue('');
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[storedKey.status];
  const hint = STATUS_HINT[storedKey.status];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          value={`•••• ${storedKey.lastFour}`}
          aria-label={`${label} API key`}
          className="flex-1"
          disabled
        />
        <Badge variant={badge.color === 'success' ? 'default' : 'secondary'}>{badge.label}</Badge>
      </div>

      {hint && <p className="text-tertiary text-xs">{hint}</p>}

      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
          Replace
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onRemove}
          disabled={isRemoving}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
