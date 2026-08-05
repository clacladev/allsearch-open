'use client';

import { useEffect, useRef } from 'react';
import { XClose } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { CollectionRunProgress } from './CollectionRunProgress';
import { useCollectionRunContext } from './CollectionRunContext';

// Reserves space for this fixed bar via a CSS variable on the document root, so page content that
// pins to the bottom (e.g. the sidebar's footer cards) can pad itself clear of the overlap instead
// of being covered by it. See app/(private)/components/Sidebar/Sidebar.tsx.
const BAR_HEIGHT_CSS_VAR = '--collection-run-bar-height';

export function CollectionRunProgressBar() {
  const { progress, isReconnecting, isStreamError, cancel, isCancelling, clear } =
    useCollectionRunContext();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!progress || !barRef.current) {
      root.style.removeProperty(BAR_HEIGHT_CSS_VAR);
      return;
    }
    const el = barRef.current;
    const observer = new ResizeObserver(() => {
      root.style.setProperty(BAR_HEIGHT_CSS_VAR, `${el.offsetHeight}px`);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty(BAR_HEIGHT_CSS_VAR);
    };
  }, [progress]);

  if (!progress) return null;

  const isDismissable = progress.isTerminal || isStreamError;

  return (
    <div
      ref={barRef}
      className="border-secondary fixed inset-x-0 bottom-0 z-50 border-t bg-primary px-4 py-3"
    >
      <div className="mx-auto flex max-w-5xl items-start gap-3">
        <div className="flex-1">
          <CollectionRunProgress
            progress={progress}
            variant="bar"
            isReconnecting={isReconnecting}
            onCancel={cancel}
            isCancelling={isCancelling}
          />
        </div>

        {isDismissable && (
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
