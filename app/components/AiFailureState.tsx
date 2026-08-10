'use client';

import { useRouter } from 'next/navigation';
import { EmptyState, type EmptyStateVariant } from '@/app/(private)/components/EmptyState';
import { ROUTES, RouteHelper } from '@/libs/routes';
import type { AiErrorCode } from '@/libs/ai/errors';
import type { ProviderId } from '@/libs/database/shared/ProviderId';

// Lives at app/components/ rather than app/(private)/components/ because it's used from both the
// (private) route group and (new-project) onboarding — sibling route groups can't reach into one
// another without an awkward relative-ish import, and this folder (no page.tsx) is a plain shared
// location both can import from.

const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: 'OpenAI',
  google: 'Google',
  perplexity: 'Perplexity',
};

export type AiFailureFixDestination = 'settings' | 'keys';

type FailureCopy = {
  title: string;
  description: string;
  actionTitle: string;
  iconColor: 'warning' | 'error';
};

/** Pure copy lookup, exported for unit testing without rendering the component (this repo has no
 * component-testing infrastructure — see tests/unit/components/AiFailureState.test.ts). Keyed by
 * `code` + `provider` + where the fix lives, per issue 09/16: the three credential failure states,
 * applied uniformly everywhere they occur. Onboarding has no Settings screen reachable (the private
 * layout redirects `/settings` back to `/new-project` while there are no projects), so the
 * onboarding variant points at `/keys` instead. Still not reworded per call site — only per
 * destination. */
export function getAiFailureStateCopy(
  code: AiErrorCode,
  provider: ProviderId,
  destination: AiFailureFixDestination = 'settings'
): FailureCopy {
  const providerLabel = PROVIDER_LABELS[provider];

  if (destination === 'keys') {
    switch (code) {
      case 'NO_KEY':
        return {
          title: 'Needs an API key',
          description: `This step needs a ${providerLabel} API key. Add one to continue setting up your project.`,
          actionTitle: 'Add your API key',
          iconColor: 'warning',
        };
      case 'INVALID_KEY':
        return {
          title: 'API key was rejected',
          description: `Your ${providerLabel} API key was rejected. It may have been revoked or changed — replace it to continue.`,
          actionTitle: 'Fix your API key',
          iconColor: 'error',
        };
      case 'RATE_LIMITED':
        return {
          title: 'Quota or rate limit reached',
          description: `Your ${providerLabel} account has hit its usage limit. That's your account's own limit, not ours — wait and retry, or replace the key to continue.`,
          actionTitle: 'Fix your API key',
          iconColor: 'warning',
        };
    }
  }

  switch (code) {
    case 'NO_KEY':
      return {
        title: 'Needs an API key',
        description: `This feature needs a ${providerLabel} API key. Add one in Settings to turn it on.`,
        actionTitle: 'Go to Settings',
        iconColor: 'warning',
      };
    case 'INVALID_KEY':
      return {
        title: 'API key was rejected',
        description: `Your ${providerLabel} API key was rejected. It may have been revoked or changed — update it in Settings.`,
        actionTitle: 'Go to Settings',
        iconColor: 'error',
      };
    case 'RATE_LIMITED':
      return {
        title: 'Quota or rate limit reached',
        description: `Your ${providerLabel} account has hit its usage limit. That's your account's own limit, not ours — try again later, or check your plan in Settings.`,
        actionTitle: 'Go to Settings',
        iconColor: 'warning',
      };
  }
}

/**
 * Shared UI for the three AI-credential failure states named in issue 09 (no key / invalid key /
 * rate limited), keyed by `AiErrorCode` + `ProviderId`. Every AI-dependent surface that classifies
 * an error via `libs/ai/errors.ts`'s `toAiError` (server side) or `isAiErrorCode` (client side,
 * reading `AppFetchError.code`) should render this instead of inventing its own copy — see the
 * component's docblock in EmptyState.tsx for why it composes over that rather than duplicating it.
 */
export function AiFailureState({
  code,
  provider,
  variant,
  className,
  fixDestination = 'settings',
}: {
  code: AiErrorCode;
  provider: ProviderId;
  variant?: EmptyStateVariant;
  className?: string;
  fixDestination?: AiFailureFixDestination;
}) {
  const router = useRouter();
  const { title, description, actionTitle, iconColor } = getAiFailureStateCopy(
    code,
    provider,
    fixDestination
  );

  return (
    <EmptyState
      title={title}
      description={description}
      variant={variant}
      className={className}
      iconColor={iconColor}
      customActionTitle={actionTitle}
      customAction={() =>
        router.push(fixDestination === 'keys' ? RouteHelper.Keys.getFix() : ROUTES.SETTINGS)
      }
    />
  );
}
