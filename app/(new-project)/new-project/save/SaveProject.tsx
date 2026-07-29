'use client';

import { useEffect } from 'react';
import { RouteHelper, ROUTES } from '@/libs/routes';
import { useRouter } from 'next/navigation';
import FormHeader from '../components/FormHeader';
import {
  NewProjectBrand,
  NewProjectCompetitors,
  routeForStep,
  NewProjectStep,
  useNewProjectContext,
} from '../components/NewProjectContext';
import { SaveNewProjectResponse } from '@/app/api/new-project/save/types';
import useSWRImmutable from 'swr/immutable';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { PromptAndTopicId } from '@/libs/utils/PromptAndTopicId';
import { NewProjectLayoutColumn } from '../../layout';
import { appFetch } from '@/hooks/appFetch';

const THIS_STEP = NewProjectStep.Save;

const useSaveProject = (
  brand: NewProjectBrand | undefined,
  selectedPromptsIds: PromptAndTopicId[] | undefined,
  competitors: NewProjectCompetitors | undefined,
  onSuccess: (data: SaveNewProjectResponse) => void
) =>
  useSWRImmutable(
    !!brand && !!selectedPromptsIds?.length && !!competitors?.length
      ? ['complete-onboarding', brand, selectedPromptsIds, competitors]
      : null,
    async () =>
      appFetch<SaveNewProjectResponse>(
        ROUTES.API.NEW_PROJECT.SAVE,
        {
          method: 'POST',
          body: JSON.stringify({
            brand,
            promptsIds: selectedPromptsIds,
            competitors,
          }),
        },
        'Failed to save project'
      ),
    { onSuccess }
  );

export default function SaveProject() {
  const router = useRouter();
  const { getCorrectStep, resetAll, brand, prompts, competitors } = useNewProjectContext();

  const { isLoading, error } = useSaveProject(
    brand,
    prompts?.selectedIds ?? [],
    competitors,
    (data) => {
      resetAll();
      router.replace(RouteHelper.NewProject.getReport(data.projectId));
    }
  );

  useEffect(() => {
    const correctStep = getCorrectStep();
    if (correctStep < THIS_STEP) router.push(routeForStep(correctStep));
  }, []);

  return (
    <NewProjectLayoutColumn>
      <FormHeader title="Saving your project..." description="" />
      {isLoading && <LoadingIndicator />}
      {error && <div className="text-error-800 -mt-4 ml-0.5 text-xs">{error.message}</div>}
    </NewProjectLayoutColumn>
  );
}
