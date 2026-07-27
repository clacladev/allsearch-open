'use client';

import { useState, useTransition } from 'react';
import { TabList, Tabs } from '@/components/application/tabs/tabs';
import { NativeSelect } from '@/components/base/select/select-native';
import { ConfirmModal } from '@/app/(private)/components/ConfirmModal';
import { showErrorAlertToast, showSuccessAlertToast } from '@/app/(public)/components/Alerts';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { ProjectRow } from '@/libs/database/Projects/types';
import ProjectsTable from './ProjectsTable';

type AdminProjectRow = Pick<
  ProjectRow,
  'id' | 'name' | 'hostname' | 'is_paused' | 'is_archived' | 'author_id' | 'created_at'
>;

export type UsersInfoMap = Record<string, { email: string; lastActiveAt: string | null }>;

const ADMIN_TABS = [{ id: 'projects', label: 'Projects' }];

export default function AdminPanelSections({
  initialProjects,
  usersInfo,
}: {
  initialProjects: AdminProjectRow[];
  usersInfo: UsersInfoMap;
}) {
  const [selectedTabId, setSelectedTabId] = useState(ADMIN_TABS[0].id);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <section>
        <NativeSelect
          aria-label="Admin panel tabs"
          className="md:hidden"
          value={selectedTabId}
          onChange={(event) => setSelectedTabId(event.target.value)}
          options={ADMIN_TABS.map((tab) => ({ label: tab.label, value: tab.id }))}
        />

        <div className="scrollbar-hide -mx-4 -my-1 flex overflow-auto px-4 py-1 lg:-mx-8 lg:px-8">
          <Tabs
            className="hidden md:flex xl:w-full"
            selectedKey={selectedTabId}
            onSelectionChange={(value) => setSelectedTabId(value as string)}
          >
            <TabList type="button-minimal" className="w-full" items={ADMIN_TABS} />
          </Tabs>
        </div>
      </section>

      {/* Content */}
      <section>
        {selectedTabId === 'projects' && (
          <ProjectsSection initialProjects={initialProjects} usersInfo={usersInfo} />
        )}
      </section>
    </div>
  );
}

function ProjectsSection({
  initialProjects,
  usersInfo,
}: {
  initialProjects: AdminProjectRow[];
  usersInfo: UsersInfoMap;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [archiveTargetProjectId, setArchiveTargetProjectId] = useState<string>();
  const [deleteTargetProjectId, setDeleteTargetProjectId] = useState<string>();
  const [cloneTargetProjectId, setCloneTargetProjectId] = useState<string>();
  const [, startPauseTransition] = useTransition();
  const [isArchiving, startArchiveTransition] = useTransition();
  const [isRestoring, startRestoreTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isCloning, startCloneTransition] = useTransition();

  const archiveTargetProject = projects.find((p) => p.id === archiveTargetProjectId);
  const deleteTargetProject = projects.find((p) => p.id === deleteTargetProjectId);
  const cloneTargetProject = projects.find((p) => p.id === cloneTargetProjectId);

  const onTogglePause = (projectId: string) => {
    startPauseTransition(async () => {
      try {
        const updatedProject = await appFetch<AdminProjectRow>(
          RouteHelper.Api.Admin.getProjectPause(projectId),
          { method: 'POST' },
          'Failed to toggle pause'
        );
        setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
        showSuccessAlertToast(
          updatedProject.is_paused ? 'Project paused' : 'Project resumed',
          `${updatedProject.name} has been ${updatedProject.is_paused ? 'paused' : 'resumed'}.`
        );
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onArchiveProject = () => {
    if (!archiveTargetProjectId) return;
    startArchiveTransition(async () => {
      try {
        const updatedProject = await appFetch<AdminProjectRow>(
          RouteHelper.Api.Admin.getProjectArchive(archiveTargetProjectId),
          { method: 'POST', body: JSON.stringify({ action: 'archive' }) },
          'Failed to archive project'
        );
        const projectName = updatedProject.name;
        setProjects((prev) =>
          prev.map((project) => (project.id === updatedProject.id ? updatedProject : project))
        );
        setArchiveTargetProjectId(undefined);
        showSuccessAlertToast(`Project ${projectName} archived`, 'Project has been archived.');
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onRestoreProject = (projectId: string) => {
    startRestoreTransition(async () => {
      try {
        const updatedProject = await appFetch<AdminProjectRow>(
          RouteHelper.Api.Admin.getProjectArchive(projectId),
          { method: 'POST', body: JSON.stringify({ action: 'restore' }) },
          'Failed to restore project'
        );
        setProjects((prev) =>
          prev.map((project) => (project.id === updatedProject.id ? updatedProject : project))
        );
        showSuccessAlertToast(
          `Project ${updatedProject.name} restored`,
          'Project has been unarchived and is active in the application again.'
        );
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onDeleteProject = () => {
    if (!deleteTargetProjectId) return;
    startDeleteTransition(async () => {
      try {
        const projectName = deleteTargetProject?.name;
        await appFetch(
          RouteHelper.Api.Admin.getProjectDelete(deleteTargetProjectId),
          { method: 'POST' },
          'Failed to delete project'
        );
        setProjects((prev) => prev.filter((p) => p.id !== deleteTargetProjectId));
        setDeleteTargetProjectId(undefined);
        showSuccessAlertToast(
          `Project ${projectName} deleted`,
          'Project and all associated data have been permanently deleted.'
        );
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onCloneProject = () => {
    if (!cloneTargetProjectId) return;
    startCloneTransition(async () => {
      try {
        const clonedProject = await appFetch<AdminProjectRow>(
          RouteHelper.Api.Admin.getProjectClone(cloneTargetProjectId),
          { method: 'POST' },
          'Failed to clone project'
        );
        setProjects((prev) => [...prev, clonedProject]);
        setCloneTargetProjectId(undefined);
        showSuccessAlertToast(
          `Project cloned`,
          `${clonedProject.name} has been created in your account.`
        );
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  if (projects.length === 0) {
    return (
      <div className="max-w-4xl">
        <p className="text-secondary text-sm">No projects found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <ProjectsTable
        projects={projects}
        usersInfo={usersInfo}
        onTogglePause={onTogglePause}
        onArchive={setArchiveTargetProjectId}
        onRestore={onRestoreProject}
        onDelete={setDeleteTargetProjectId}
        onClone={setCloneTargetProjectId}
      />

      {archiveTargetProject && (
        <ConfirmModal
          isOpen={!!archiveTargetProjectId}
          setIsOpen={(open) => {
            if (!open) setArchiveTargetProjectId(undefined);
          }}
          variant="delete"
          title={`Archive ${archiveTargetProject.name} project`}
          description="Are you sure you want to archive this project? It will be hidden from active project lists."
          isLoading={isArchiving || isRestoring}
          action={onArchiveProject}
        />
      )}

      {deleteTargetProject && (
        <ConfirmModal
          isOpen={!!deleteTargetProjectId}
          setIsOpen={(open) => {
            if (!open) setDeleteTargetProjectId(undefined);
          }}
          variant="delete"
          title={`Permanently delete ${deleteTargetProject.name}`}
          description="This action is irreversible. The project and all its data (topics, prompts, competitors, responses, and sources) will be permanently deleted."
          isLoading={isDeleting}
          action={onDeleteProject}
        />
      )}

      {cloneTargetProject && (
        <ConfirmModal
          isOpen={!!cloneTargetProjectId}
          setIsOpen={(open) => {
            if (!open) setCloneTargetProjectId(undefined);
          }}
          variant="confirm"
          title={`Clone ${cloneTargetProject.name}`}
          description="All data of this project (topics, prompts, competitors, and responses) will be cloned into your account. The original project and its owner will not be affected in any way. This will occupy additional storage space."
          isLoading={isCloning}
          action={onCloneProject}
        />
      )}
    </div>
  );
}
