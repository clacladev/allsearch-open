'use client';

import { useState, useTransition } from 'react';
import { Copy, PauseCircle, PlayCircle, RefreshCw, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SettingsSectionLabel from './SettingsSectionLabel';
import SettingsFormHeader from '@/components/settings/SettingsFormHeader';
import { ConfirmModal } from '@/app/(private)/components/ConfirmModal';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { isDevEnv } from '@/libs/env';
import type { ProjectRow } from '@/libs/database/Projects/types';

type PendingAction = {
  project: ProjectRow;
  kind: 'archive' | 'restore' | 'delete' | 'fill';
};

/** Cross-tenant actions from before this was single-user. There is no admin and no tenancy
 * locally, so they survive ungated — the single user is the operator. They live app-level rather
 * than under a Project because several of them (clone, delete) outlive the Project they act on. */
export default function DeveloperSettings({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction | undefined>();
  const [busyProjectId, setBusyProjectId] = useState<string | undefined>();
  const [isRunning, startTransition] = useTransition();

  const runAction = (
    project: ProjectRow,
    request: () => Promise<unknown>,
    onSuccess: (result: unknown) => void
  ) => {
    setBusyProjectId(project.id);
    startTransition(async () => {
      try {
        onSuccess(await request());
        setPendingAction(undefined);
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      } finally {
        setBusyProjectId(undefined);
      }
    });
  };

  const onClone = (project: ProjectRow) =>
    runAction(
      project,
      () =>
        appFetch<ProjectRow>(
          RouteHelper.Api.Developer.getProjectClone(project.id),
          { method: 'POST' },
          'Failed to clone the project'
        ),
      (result) => {
        showSuccessAlertToast('Project cloned', `Created “${(result as ProjectRow).name}”.`);
        router.refresh();
      }
    );

  const onTogglePause = (project: ProjectRow) =>
    runAction(
      project,
      () =>
        appFetch<ProjectRow>(
          RouteHelper.Api.Developer.getProjectPause(project.id),
          { method: 'POST' },
          'Failed to pause the project'
        ),
      (result) => {
        showSuccessAlertToast(
          (result as ProjectRow).is_paused ? 'Project paused' : 'Project resumed',
          (result as ProjectRow).is_paused
            ? 'It will be skipped by the next Collection Run.'
            : 'It will be included in the next Collection Run.'
        );
        router.refresh();
      }
    );

  const onToggleArchive = (project: ProjectRow) =>
    runAction(
      project,
      () =>
        appFetch(
          RouteHelper.Api.Project.getProjectArchive(project.id),
          {
            method: 'POST',
            body: JSON.stringify({ action: project.is_archived ? 'restore' : 'archive' }),
          },
          'Failed to archive the project'
        ),
      () => {
        showSuccessAlertToast(
          project.is_archived ? 'Project restored' : 'Project archived',
          project.name
        );
        router.refresh();
      }
    );

  const onDelete = (project: ProjectRow) =>
    runAction(
      project,
      () =>
        appFetch(
          RouteHelper.Api.Developer.getProjectDelete(project.id),
          { method: 'POST' },
          'Failed to delete the project'
        ),
      () => {
        showSuccessAlertToast('Project deleted', `“${project.name}” and all its data are gone.`);
        router.refresh();
      }
    );

  // The only caller that passes `shouldForce`. Without it a Project cannot be collected twice
  // inside one weekly cadence, which is exactly what you want while developing against it.
  const onForceRun = (project: ProjectRow) =>
    runAction(
      project,
      () =>
        appFetch<{ runId: string }>(
          RouteHelper.Api.Project.getProcessPrompts(project.id, true),
          { method: 'POST' },
          'Failed to start a Collection Run'
        ),
      (result) => {
        showSuccessAlertToast(
          'Collection Run started',
          `Run ${(result as { runId: string }).runId} is collecting ${project.name}.`
        );
        router.refresh();
      }
    );

  const onFillPromptResponses = (project: ProjectRow) =>
    runAction(
      project,
      () =>
        appFetch<{ promptsCreated: number; responsesCreated: number; sourcesCreated: number }>(
          RouteHelper.Api.Developer.getProjectFillPromptResponses(project.id),
          { method: 'POST' },
          'Failed to backfill prompt responses'
        ),
      (result) => {
        const { promptsCreated, responsesCreated, sourcesCreated } = result as {
          promptsCreated: number;
          responsesCreated: number;
          sourcesCreated: number;
        };
        showSuccessAlertToast(
          'Backfill complete',
          `Created ${promptsCreated} prompts, ${responsesCreated} responses, ${sourcesCreated} sources.`
        );
        router.refresh();
      }
    );

  const confirmCopy: Record<PendingAction['kind'], { title: string; description: string }> = {
    archive: {
      title: 'Archive project',
      description:
        'Archiving hides the project from the app. Its data is kept and it can be restored from here.',
    },
    restore: {
      title: 'Restore project',
      description: 'The project will reappear in the project list and in Collection Runs.',
    },
    delete: {
      title: 'Delete project permanently',
      description:
        'This erases the project and every prompt, response and source belonging to it. This cannot be undone.',
    },
    fill: {
      title: 'Fill prompt responses',
      description:
        'Creates placeholder prompts and backfills responses for the last 91 days. This may take a while.',
    },
  };

  return (
    <div className="flex flex-col gap-5">
      <SettingsFormHeader
        title="Developer"
        description="Direct control over Projects. These were staff tools in the hosted product; locally you are staff."
      />

      <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

      {projects.length === 0 ? (
        <p className="text-md text-tertiary">No projects yet.</p>
      ) : (
        projects.map((project, index) => (
          <div key={project.id}>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
              <SettingsSectionLabel
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {project.name}
                    {project.is_paused && <Badge variant="secondary">Paused</Badge>}
                    {project.is_archived && <Badge variant="outline">Archived</Badge>}
                  </span>
                }
                description={project.hostname || undefined}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isRunning && busyProjectId === project.id}
                  onClick={() => onClone(project)}
                >
                  <Copy aria-hidden="true" /> Clone
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isRunning && busyProjectId === project.id}
                  onClick={() => onTogglePause(project)}
                >
                  {project.is_paused ? (
                    <PlayCircle aria-hidden="true" />
                  ) : (
                    <PauseCircle aria-hidden="true" />
                  )}{' '}
                  {project.is_paused ? 'Resume' : 'Pause'}
                </Button>

                {!project.is_archived && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isRunning && busyProjectId === project.id}
                    onClick={() => onForceRun(project)}
                  >
                    <RefreshCw aria-hidden="true" /> Force run
                  </Button>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isRunning && busyProjectId === project.id}
                  onClick={() =>
                    setPendingAction({
                      project,
                      kind: project.is_archived ? 'restore' : 'archive',
                    })
                  }
                >
                  {project.is_archived ? 'Restore' : 'Archive'}
                </Button>

                {isDevEnv && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isRunning && busyProjectId === project.id}
                    onClick={() => setPendingAction({ project, kind: 'fill' })}
                  >
                    Fill responses
                  </Button>
                )}

                {/* Deleting is gated on the project already being archived, server-side too, so
                    that erasing a project is always a deliberate second step. */}
                {project.is_archived && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isRunning && busyProjectId === project.id}
                    onClick={() => setPendingAction({ project, kind: 'delete' })}
                  >
                    <Trash aria-hidden="true" /> Delete
                  </Button>
                )}
              </div>
            </div>

            {index < projects.length - 1 && (
              <hr className="bg-border-secondary mt-5 h-px w-full border-none" aria-hidden="true" />
            )}
          </div>
        ))
      )}

      {pendingAction && (
        <ConfirmModal
          isOpen
          setIsOpen={(isOpen) => !isOpen && setPendingAction(undefined)}
          variant={pendingAction.kind === 'delete' ? 'delete' : 'confirm'}
          title={confirmCopy[pendingAction.kind].title}
          description={`${confirmCopy[pendingAction.kind].description}\n\n${pendingAction.project.name}`}
          isLoading={isRunning}
          action={() => {
            const { project, kind } = pendingAction;
            if (kind === 'delete') return onDelete(project);
            if (kind === 'fill') return onFillPromptResponses(project);
            return onToggleArchive(project);
          }}
        />
      )}
    </div>
  );
}
