import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';
import { Opportunity } from '@/libs/utils/project-analysis/types';
import {
  createOpportunitiesTableColumnDefs,
  OpportunitiesTableMeta,
} from './opportunitiesTableColumnDefs';
import { PromptRow } from '@/libs/database/Prompts/types';
import StandardTable from '@/app/(private)/components/StandardTable/StandardTable';
import type { SortDescriptor } from 'react-aria-components';
import { useMemo } from 'react';

export function OpportunitiesTable({
  opportunities,
  totalPages,
  prompts,
  projectId,
  startDate,
  endDate,
  tableHeader,
  tableFooter,
  sortDescriptor,
  onSortChange,
  hideSorting,
}: {
  opportunities: Opportunity[];
  totalPages?: number;
  prompts: PromptRow[];
  projectId: string;
  startDate?: string;
  endDate?: string;
  tableHeader?: React.ReactNode;
  tableFooter?: React.ReactNode;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  hideSorting?: boolean;
}) {
  const columns = useMemo(() => createOpportunitiesTableColumnDefs(!hideSorting), [hideSorting]);
  const table = useReactTable({
    columns,
    data: opportunities,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    meta: { prompts, projectId, startDate, endDate } as OpportunitiesTableMeta,
  });

  return (
    <StandardTable
      reactTable={table}
      ariaLabel="Opportunities List"
      tableHeader={tableHeader}
      tableFooter={tableFooter}
      emptyStateTitle="No opportunities found"
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      hideSorting={hideSorting}
    />
  );
}
