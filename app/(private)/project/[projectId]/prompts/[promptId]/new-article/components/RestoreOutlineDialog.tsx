'use client';

import { ConfirmModal } from '@/app/(private)/components/ConfirmModal';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  onConfirm: () => void;
};

export function RestoreOutlineDialog({ isOpen, setIsOpen, isLoading, onConfirm }: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      variant="delete"
      title="Restore the original outline?"
      description="Your edits will be discarded."
      actionLabel="Restore"
      isLoading={isLoading}
      action={onConfirm}
    />
  );
}
