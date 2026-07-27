import { Button } from '@/components/base/buttons/button';
import SettingsFormHeader from './SettingsFormHeader';
import { RouteHelper } from '@/libs/routes';
import { appFetch } from '@/hooks/appFetch';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { useState, useTransition } from 'react';
import { showSuccessAlertToast } from '@/components/Alerts';
import { SectionLabel } from '@/components/application/section-headers/section-label';
import { ConfirmModal } from '@/app/(private)/components/ConfirmModal';
import { isDevEnv } from '@/libs/env';

export default function AdminTools() {
  const { currentProject } = usePrivateLayoutContext();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [runId, setRunId] = useState<string | undefined>();
  const [isFilling, startFillTransition] = useTransition();
  const [isFillModalOpen, setIsFillModalOpen] = useState(false);

  const updateProjectPromptResponses = () => {
    if (!currentProject?.id) return;
    startUpdateTransition(async () => {
      try {
        const { runId } = await appFetch<{ runId: string }>(
          RouteHelper.Api.Project.getProcessPrompts(currentProject.id, true)
        );
        setRunId(runId);
        showSuccessAlertToast(
          'Update project prompt responses started',
          'It will take up to a minute to complete.'
        );
      } catch (error) {
        console.error(error);
      }
    });
  };

  const fillPromptResponses = () => {
    if (!currentProject?.id) return;
    startFillTransition(async () => {
      try {
        const result = await appFetch<{
          promptsCreated: number;
          responsesCreated: number;
          sourcesCreated: number;
        }>(RouteHelper.Api.Admin.getProjectFillPromptResponses(currentProject.id), {
          method: 'POST',
        });
        setIsFillModalOpen(false);
        showSuccessAlertToast(
          'Backfill complete',
          `Created ${result.promptsCreated} prompts, ${result.responsesCreated} responses, ${result.sourcesCreated} sources.`
        );
      } catch (error) {
        console.error(error);
        setIsFillModalOpen(false);
      }
    });
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col gap-5">
        <SettingsFormHeader title="Admin Tools" description="Tools for admins only." />

        <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
          <SectionLabel.Root
            size="sm"
            title="Update project prompt responses"
            description="It will take up to a minute to complete."
          />

          <div className="flex w-max flex-col gap-4">
            <Button
              type="submit"
              color="secondary"
              isDisabled={isUpdating}
              isLoading={isUpdating}
              onClick={updateProjectPromptResponses}
            >
              Update Prompt Responses
            </Button>

            {runId && (
              <p className="text-sm">
                Run ID: <span className="text-utility-green-700">{runId}</span>
              </p>
            )}
          </div>
        </div>

        {isDevEnv && (
          <>
            <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
              <SectionLabel.Root
                size="sm"
                title="Fill prompt responses for last three months"
                description="Dev only. Creates placeholder prompts up to the max limit and backfills responses for every chatbot for every day of the last 91 days."
              />

              <div className="flex w-max flex-col gap-4">
                <Button
                  type="button"
                  color="secondary"
                  isDisabled={isFilling}
                  isLoading={isFilling}
                  onClick={() => setIsFillModalOpen(true)}
                >
                  Fill Prompt Responses
                </Button>
              </div>
            </div>

            <ConfirmModal
              isOpen={isFillModalOpen}
              setIsOpen={setIsFillModalOpen}
              variant="confirm"
              title="Fill prompt responses"
              description="This will create placeholder prompts and backfill responses for the last 91 days. This may take a while."
              isLoading={isFilling}
              action={fillPromptResponses}
            />
          </>
        )}
      </div>
    </div>
  );
}
