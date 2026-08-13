'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Check, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cx } from '@/utils/cx';
import type { SaveState } from '../hooks/useOutlineAutosave';

type Props = {
  state: SaveState;
  onRetry: () => void;
  className?: string;
};

const MINUTE = 60_000;

function formatRelative(fromIso: string, now: number): string {
  const diff = Math.max(0, now - new Date(fromIso).getTime());
  if (diff < 30_000) return 'just now';
  if (diff < MINUTE) return 'less than a minute ago';
  const minutes = Math.round(diff / MINUTE);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function SaveStatusPill({ state, onRetry, className }: Props) {
  // Refresh on window focus only — battery-friendly, and the relative-time
  // shift is only meaningful when the user is actively looking.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (state.status !== 'saved') return;
    const handler = () => setNow(Date.now());
    setNow(Date.now());
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [state.status, state.lastSavedAt]);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="save-status-pill"
      className={cx(
        // Fixed height keeps surrounding layout from shifting when the pill
        // toggles between idle (empty) and visible states.
        'text-tertiary flex h-5 items-center gap-1.5 text-xs font-medium',
        className
      )}
    >
      {state.status === 'typing' && (
        <Badge variant="secondary">
          <Pencil aria-hidden="true" />
          Editing…
        </Badge>
      )}
      {state.status === 'saving' && (
        <Badge>
          <Spinner aria-hidden="true" />
          Saving…
        </Badge>
      )}
      {state.status === 'saved' && state.lastSavedAt && (
        <Badge className="bg-emerald-600 text-white">
          <Check aria-hidden="true" />
          Saved {formatRelative(state.lastSavedAt, now)}
        </Badge>
      )}
      {state.status === 'unsaved' && (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
          <AlertTriangle aria-hidden="true" />
          Edits not saved
        </Badge>
      )}
      {state.status === 'error' && (
        <>
          <Badge variant="destructive">
            <AlertCircle aria-hidden="true" />
            Could not save
          </Badge>
          <Button
            variant="link"
            size="sm"
            onClick={onRetry}
            className="pointer-events-auto !h-auto !p-0 text-xs"
          >
            Retry
          </Button>
        </>
      )}
    </div>
  );
}
