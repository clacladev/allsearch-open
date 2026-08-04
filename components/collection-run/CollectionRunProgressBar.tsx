'use client';

import { XClose } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { CollectionRunProgress } from './CollectionRunProgress';
import { useCollectionRunProgress } from './useCollectionRunProgress';

export function CollectionRunProgressBar() {
  const { progress, isReconnecting, cancel, isCancelling, clear } = useCollectionRunProgress();

  if (!progress) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-primary px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-start gap-3">
        <div className="flex-1">
          <CollectionRunProgress
            progress={progress}
            variant="bar"
            isReconnecting={isReconnecting}
            onCancel={progress.isTerminal ? undefined : cancel}
            isCancelling={isCancelling}
          />
        </div>

        {progress.isTerminal && (
          <Button
            size="sm"
            color="tertiary"
            data-testid="collection-run-progress-dismiss"
            iconLeading={XClose}
            onClick={clear}
          />
        )}
      </div>
    </div>
  );
}
