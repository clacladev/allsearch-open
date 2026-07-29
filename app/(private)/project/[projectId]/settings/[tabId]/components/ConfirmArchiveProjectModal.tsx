import { ConfirmModal, ModalProps } from '@/app/(private)/components/ConfirmModal';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { RouteHelper } from '@/libs/routes';
import { useTransition } from 'react';
import { appFetch } from '@/hooks/appFetch';

export function ConfirmArchiveProjectModal({
  isOpen,
  setIsOpen,
  projectId,
  projectName,
  onSuccess,
}: ModalProps & {
  projectId: string;
  projectName: string;
  onSuccess: () => void;
}) {
  const [isArchiving, startArchiveTransition] = useTransition();

  const onArchive = () => {
    startArchiveTransition(async () => {
      try {
        await appFetch(
          RouteHelper.Api.Project.getProjectArchive(projectId),
          { method: 'POST', body: JSON.stringify({ action: 'archive' }) },
          'Failed to archive project'
        );
        showSuccessAlertToast(
          `Project ${projectName} archived`,
          'Project has been archived correctly'
        );
        onSuccess();
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      variant="archive"
      title={`Archive ${projectName} project`}
      description={`Are you sure you want to archive this project? You can restore it later from the database.`}
      isLoading={isArchiving}
      action={onArchive}
    />
  );
}
