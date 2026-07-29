'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Check, Edit05 } from '@untitledui/icons';
import { Badge, BadgeWithIcon } from '@/components/base/badges/badges';
import { Button } from '@/components/base/buttons/button';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
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
        'flex h-5 items-center gap-1.5 text-xs font-medium text-tertiary',
        className
      )}
    >
      {state.status === 'typing' && (
        <BadgeWithIcon size="sm" color="gray" type="pill-color" iconLeading={Edit05}>
          Editing…
        </BadgeWithIcon>
      )}
      {state.status === 'saving' && (
        <Badge size="sm" color="brand" type="pill-color" className="gap-1">
          <LoadingIndicator size="xxs" color="brand" />
          Saving…
        </Badge>
      )}
      {state.status === 'saved' && state.lastSavedAt && (
        <BadgeWithIcon size="sm" color="success" type="pill-color" iconLeading={Check}>
          Saved {formatRelative(state.lastSavedAt, now)}
        </BadgeWithIcon>
      )}
      {state.status === 'unsaved' && (
        <BadgeWithIcon size="sm" color="warning" type="pill-color" iconLeading={AlertTriangle}>
          Edits not saved
        </BadgeWithIcon>
      )}
      {state.status === 'error' && (
        <>
          <BadgeWithIcon size="sm" color="error" type="pill-color" iconLeading={AlertCircle}>
            Could not save
          </BadgeWithIcon>
          <Button
            color="link-color"
            size="sm"
            onClick={onRetry}
            className="!h-auto !p-0 text-xs pointer-events-auto"
          >
            Retry
          </Button>
        </>
      )}
    </div>
  );
}
