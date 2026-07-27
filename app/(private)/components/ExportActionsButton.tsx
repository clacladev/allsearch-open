'use client';

import { Button } from '@/components/base/buttons/button';
import { Dropdown } from '@/components/base/dropdown/dropdown';
import { DownloadCloud01, FileCheck02 } from '@untitledui/icons';
import { useState } from 'react';

export function ExportActionsButton({ onExportCsvAction }: { onExportCsvAction?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <div
        className={
          isOpen
            ? 'bg-overlay/70 fixed inset-0 z-40 opacity-100 transition-opacity duration-100 ease-linear'
            : 'bg-overlay/70 pointer-events-none fixed inset-0 z-40 opacity-0 transition-opacity duration-200 ease-linear'
        }
        aria-hidden="true"
      />

      <Dropdown.Root isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button color="secondary" size="sm" iconLeading={DownloadCloud01}>
          Export
        </Button>

        <Dropdown.Popover className="z-50">
          <Dropdown.Menu aria-label="Export actions" selectionMode="none">
            <Dropdown.Item label="Export as CSV" icon={FileCheck02} onAction={onExportCsvAction} />
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
    </>
  );
}
