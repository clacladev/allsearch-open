import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';
import { PaginatedResult } from '@/libs/utils/PaginatedResult';
import { PaginationPageDefault } from '@/components/application/pagination/pagination';
import StandardTable from '@/app/(private)/components/StandardTable/StandardTable';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { useMemo } from 'react';
import { EmptyState } from '@/app/(private)/components/EmptyState';
import type { SortDescriptor } from 'react-aria-components';
import {
  createBrandsSourcesTableColumnDefs,
  BrandsSourcesTableMeta,
} from './brandsSourcesTableColumnDefs';

export function BrandsSourcesTable({
  projectId,
  sourcesData,
  startDate,
  endDate,
  onPageChange,
  sortDescriptor,
  onSortChange,
}: {
  projectId: string;
  sourcesData: PaginatedResult<SourceContent>;
  startDate: string;
  endDate: string;
  onPageChange: (page: number) => void;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
}) {
  if (!sourcesData.data.length) return <EmptyState title="No sources found for selected brands" />;

  return (
    <BrandsSourcesTableInner
      projectId={projectId}
      sources={sourcesData.data}
      startDate={startDate}
      endDate={endDate}
      currentPage={sourcesData.currentPage}
      totalPages={sourcesData.totalPages}
      onPageChange={onPageChange}
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
    />
  );
}

function BrandsSourcesTableInner({
  projectId,
  sources,
  startDate,
  endDate,
  currentPage,
  totalPages,
  onPageChange,
  sortDescriptor,
  onSortChange,
}: {
  projectId: string;
  sources: SourceContent[];
  startDate: string;
  endDate: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
}) {
  const columns = useMemo(() => createBrandsSourcesTableColumnDefs(true), []);

  const table = useReactTable({
    columns,
    data: sources,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.url,
    meta: { projectId, startDate, endDate } as BrandsSourcesTableMeta,
  });

  return (
    <StandardTable
      reactTable={table}
      ariaLabel="Brand Sources List"
      tableFooter={
        <PaginationPageDefault
          page={currentPage + 1}
          total={totalPages}
          onPageChange={onPageChange}
          className="px-4 py-3 md:px-6 md:py-1.5"
        />
      }
      emptyStateTitle="No sources found for selected brands"
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
    />
  );
}
