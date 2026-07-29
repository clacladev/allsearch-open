import { Button } from '@/components/base/buttons/button';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { useState } from 'react';
import { Trash01 } from '@untitledui/icons';
import { ConfirmArchiveProjectModal } from './ConfirmArchiveProjectModal';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import { SectionLabel } from '@/components/application/section-headers/section-label';
import SettingsFormHeader from './SettingsFormHeader';
import { useMessagesContext } from '@/app/(private)/components/MessagesContext';
import { showSuccessAlertToast } from '@/components/Alerts';

export default function Others() {
  const router = useRouter();
  const { currentProject, removeProject } = usePrivateLayoutContext();
  const { resetAll: resetMessages } = useMessagesContext();
  const [isArchiveProjectModalOpen, setIsArchiveProjectModalOpen] = useState(false);

  const onResetMessages = () => {
    resetMessages();
    showSuccessAlertToast(
      'Messages reset successfully',
      'All hidden messages cards and tips have been reset.'
    );
  };

  const onArchiveProjectSuccess = () => {
    if (!currentProject?.id) return;
    removeProject(currentProject?.id);
    router.push(ROUTES.DASHBOARD);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col gap-5">
        <SettingsFormHeader
          title="Others"
          description="Other settings available for this project."
        />

        <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
          <SectionLabel.Root
            size="sm"
            title="Reset messages"
            description="Reset all hidden messages cards and tips."
          />

          <div className="flex w-max flex-col gap-4">
            <Button type="button" color="secondary" onClick={onResetMessages}>
              Reset messages
            </Button>
          </div>
        </div>

        <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
          <SectionLabel.Root
            size="sm"
            title={`Archive ${currentProject?.name} project`}
            description="This will archive this project and hide it from the application project lists."
          />

          <div className="flex w-max flex-col gap-4">
            <Button
              type="button"
              color="secondary-destructive"
              onClick={() => setIsArchiveProjectModalOpen(true)}
              iconLeading={Trash01}
            >
              Archive project
            </Button>
          </div>
        </div>
      </div>

      {currentProject?.id && (
        <ConfirmArchiveProjectModal
          projectId={currentProject.id}
          projectName={currentProject.name}
          isOpen={isArchiveProjectModalOpen}
          setIsOpen={setIsArchiveProjectModalOpen}
          onSuccess={onArchiveProjectSuccess}
        />
      )}
    </div>
  );
}
