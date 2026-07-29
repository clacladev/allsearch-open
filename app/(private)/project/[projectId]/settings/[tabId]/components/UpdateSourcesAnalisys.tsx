import { useState } from 'react';
import { RouteHelper } from '@/libs/routes';
import { appFetch } from '@/hooks/appFetch';
import { AlertFloating } from '@/components/application/alerts/alerts';
import useSWRMutation from 'swr/mutation';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { useRouter } from 'next/navigation';

const UPDATE_SOURCES_ANALYSIS_TIMEOUT = 20_000;

const useUpdateSourcesAnalysis = (projectId: string | undefined) =>
  useSWRMutation(
    projectId ? ['update-sources-analysis', projectId] : null,
    async ([, projectId]) => {
      await appFetch<void>(
        RouteHelper.Api.Project.getUpdateSourcesAnalysis(projectId),
        { method: 'POST' },
        'Failed to update sources analysis'
      );
      // Wait for the sources analysis to be updated in the background
      return new Promise<void>((resolve) => setTimeout(resolve, UPDATE_SOURCES_ANALYSIS_TIMEOUT));
    }
  );

export default function UpdateSourcesAnalisysAlert({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { currentProject } = usePrivateLayoutContext();
  const [isUpdateSuccessful, setIsUpdateSuccessful] = useState(false);
  const { trigger: updateSourcesAnalysis, isMutating } = useUpdateSourcesAnalysis(
    currentProject?.id
  );

  return (
    <>
      {isMutating ? (
        <AlertFloating
          color="gray"
          title="Sources analysis updating"
          description="Updating..."
          confirmLabel=""
        />
      ) : isUpdateSuccessful ? (
        <AlertFloating
          color="brand"
          title="Sources analysis updated"
          description="The last day of sources analysis has been updated."
          confirmLabel="View Sources"
          onConfirm={() =>
            router.push(RouteHelper.Project.getSourcesContents(currentProject?.id ?? ''))
          }
          onClose={() => {
            setIsUpdateSuccessful(false);
            onClose();
          }}
        />
      ) : (
        <AlertFloating
          color="brand"
          title={'Do you want to update the sources analysis?'}
          description="This will update the last day of sources analysis with the up to date competitors and brand details."
          confirmLabel="Update"
          onConfirm={async () => {
            await updateSourcesAnalysis();
            setIsUpdateSuccessful(true);
          }}
          onClose={onClose}
        />
      )}
    </>
  );
}
