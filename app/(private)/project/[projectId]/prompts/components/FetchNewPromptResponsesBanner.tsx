'use client';

import { useState } from 'react';
import { RouteHelper } from '@/libs/routes';
import { appFetch } from '@/hooks/appFetch';
import { AlertFloating } from '@/components/application/alerts/alerts';
import useSWRMutation from 'swr/mutation';

const FETCH_PROMPT_RESPONSES_TIMEOUT = 20_000;

const useFetchNewPromptResponses = (projectId: string) =>
  useSWRMutation(
    ['fetch-new-prompt-responses', projectId],
    async ([, projectId]) => {
      await appFetch<void>(
        RouteHelper.Api.Project.getFetchNewPromptResponses(projectId),
        { method: 'POST' },
        'Failed to fetch new prompt responses'
      );
      // Allow time for background workflow to begin processing
      return new Promise<void>((resolve) => setTimeout(resolve, FETCH_PROMPT_RESPONSES_TIMEOUT));
    }
  );

export default function FetchNewPromptResponsesBanner({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const [isFetchSuccessful, setIsFetchSuccessful] = useState(false);
  const { trigger: fetchNewPromptResponses, isMutating } = useFetchNewPromptResponses(projectId);

  if (isMutating) {
    return (
      <AlertFloating
        color="gray"
        title="Fetching prompt responses"
        description="This may take a few minutes. You can continue using the app."
        confirmLabel=""
      />
    );
  }

  if (isFetchSuccessful) {
    return (
      <AlertFloating
        color="brand"
        title="Responses are being fetched"
        description="New prompt responses are being processed in the background. Refresh the page in a few minutes to see results."
        confirmLabel="Dismiss"
        onConfirm={onClose}
      />
    );
  }

  return (
    <AlertFloating
      color="brand"
      title="New prompts without responses detected"
      description="Some prompts in this project don't have responses yet. Would you like to fetch them now?"
      confirmLabel="Fetch responses"
      dismissLabel="Dismiss"
      onConfirm={async () => {
        await fetchNewPromptResponses();
        setIsFetchSuccessful(true);
      }}
      onClose={onClose}
    />
  );
}
