'use client';

import { useState, useTransition } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Copy, FolderCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SectionLabel } from '@/components/application/section-headers/section-label';
import SettingsFormHeader from '@/components/settings/SettingsFormHeader';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { formatBytes } from '@/libs/numberFormatters';
import type { DatabaseFileInfo } from '@/libs/database/paths';
import type { RevealDatabaseResponse } from '@/app/api/settings/database/types';

dayjs.extend(relativeTime);

export default function DataSettings({
  databaseFileInfo,
  lastCompletedRunFinishedAt,
}: {
  databaseFileInfo: DatabaseFileInfo;
  lastCompletedRunFinishedAt: string | null;
}) {
  const [isRevealing, startRevealTransition] = useTransition();
  const [hasCopied, setHasCopied] = useState(false);

  const onCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(databaseFileInfo.path);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (error) {
      console.error(error);
      showErrorAlertToast('Could not copy the path', 'Select and copy it from the field instead.');
    }
  };

  const onReveal = () => {
    startRevealTransition(async () => {
      try {
        const { directory } = await appFetch<RevealDatabaseResponse>(
          RouteHelper.Api.Settings.getDatabaseReveal(),
          { method: 'POST' },
          'Failed to open the file manager'
        );
        showSuccessAlertToast('Opened in your file manager', directory);
      } catch (error) {
        console.error(error);
        showErrorAlertToast(
          'Could not open a file manager',
          error instanceof Error ? error.message : ''
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <SettingsFormHeader
        title="Data"
        description="Everything this app knows lives in one SQLite file on this machine. Nothing is stored anywhere else."
      />

      <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
        <SectionLabel.Root
          size="sm"
          title="Database file"
          description="Copy this file to move your data to another machine. Quit the app first so nothing is mid-write."
        />

        <div className="flex w-full flex-col items-start gap-3">
          <code className="bg-secondary text-secondary w-full rounded-lg px-3 py-2 text-xs break-all">
            {databaseFileInfo.path}
          </code>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={onCopyPath}>
              <Copy aria-hidden="true" /> {hasCopied ? 'Copied' : 'Copy path'}
            </Button>

            <Button type="button" variant="secondary" disabled={isRevealing} onClick={onReveal}>
              <FolderCode aria-hidden="true" /> Reveal in file manager{' '}
              {isRevealing && <Spinner aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </div>

      <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
        <SectionLabel.Root
          size="sm"
          title="Size on disk"
          description="Includes the write-ahead log alongside the database file."
        />

        <p className="text-md text-primary">
          {databaseFileInfo.exists
            ? formatBytes(databaseFileInfo.totalSizeBytes)
            : 'Not created yet'}
        </p>
      </div>

      <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
        <SectionLabel.Root
          size="sm"
          title="Last Collection Run"
          description="When collected data was last written to this database."
        />

        {lastCompletedRunFinishedAt ? (
          <p className="text-md text-primary">
            {dayjs(lastCompletedRunFinishedAt).fromNow()}
            <span className="text-tertiary">
              {' '}
              — {dayjs(lastCompletedRunFinishedAt).format('D MMM YYYY, HH:mm')}
            </span>
          </p>
        ) : (
          <p className="text-md text-tertiary">No Collection Run has completed yet.</p>
        )}
      </div>
    </div>
  );
}
