'use client';

import { useRouter } from 'next/navigation';
import { EmptyState, type EmptyStateVariant } from '@/app/(private)/components/EmptyState';
import { ROUTES } from '@/libs/routes';
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

type FailureCopy = {
  title: string;
  description: string;
  iconColor: 'warning' | 'error';
};

/** Pure copy lookup, exported for unit testing without rendering the component (this repo has no
 * component-testing infrastructure — see tests/unit/components/AiFailureState.test.ts). Keyed by
 * `code` + `provider` only, per issue 09: the three credential failure states, applied uniformly
 * everywhere they occur, not reworded per call site. */
export function getAiFailureStateCopy(code: AiErrorCode, provider: ProviderId): FailureCopy {
  const providerLabel = PROVIDER_LABELS[provider];
  switch (code) {
    case 'NO_KEY':
      return {
        title: 'Needs an API key',
        description: `This feature needs a ${providerLabel} API key. Add one in Settings to turn it on.`,
        iconColor: 'warning',
      };
    case 'INVALID_KEY':
      return {
        title: 'API key was rejected',
        description: `Your ${providerLabel} API key was rejected. It may have been revoked or changed — update it in Settings.`,
        iconColor: 'error',
      };
    case 'RATE_LIMITED':
      return {
        title: 'Quota or rate limit reached',
        description: `Your ${providerLabel} account has hit its usage limit. That's your account's own limit, not ours — try again later, or check your plan in Settings.`,
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
}: {
  code: AiErrorCode;
  provider: ProviderId;
  variant?: EmptyStateVariant;
  className?: string;
}) {
  const router = useRouter();
  const { title, description, iconColor } = getAiFailureStateCopy(code, provider);

  return (
    <EmptyState
      title={title}
      description={description}
      variant={variant}
      className={className}
      iconColor={iconColor}
      customActionTitle="Go to Settings"
      customAction={() => router.push(ROUTES.SETTINGS)}
    />
  );
}
