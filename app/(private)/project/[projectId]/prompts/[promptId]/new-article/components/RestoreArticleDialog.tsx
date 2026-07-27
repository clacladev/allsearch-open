'use client';

import { ConfirmModal } from '@/app/(private)/components/ConfirmModal';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  onConfirm: () => void;
};

export function RestoreArticleDialog({ isOpen, setIsOpen, isLoading, onConfirm }: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      variant="delete"
      title="Restore AI article?"
      description="This will discard your edits and show the AI's version of this article."
      actionLabel="Restore"
      isLoading={isLoading}
      action={onConfirm}
    />
  );
}
