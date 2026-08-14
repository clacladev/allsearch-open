import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';
import Loading from '@/app/(private)/loading';
import {
  createSourceDomainsTableColumnDefs,
  SourceDomainsTableMeta,
} from './sourceDomainsTableColumnDefs';
import { PaginatedResult } from '@/libs/utils/PaginatedResult';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import StandardTable from '@/app/(private)/components/StandardTable/StandardTable';
import { SourceDomain } from '@/libs/utils/project-analysis/getSourceDomainsSummary';
import {
  createSourceContentsTableColumnDefs,
  SourceContentsTableMeta,
} from './sourceContentsTableColumnDefs';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { useMemo } from 'react';
import { EmptyState } from '@/app/(private)/components/EmptyState';
import type { SortDescriptor } from 'react-aria-components';

export function SourceDomains({
  sourcesData,
  onPageChange,
  sortDescriptor,
  onSortChange,
}: {
  sourcesData: PaginatedResult<SourceDomain>;
  onPageChange: (page: number) => void;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
}) {
  if (!sourcesData.data.length) return <EmptyState title="No sources found" />;

  return (
    <SourceDomainsTable
      sources={sourcesData.data}
      totalPages={sourcesData.totalPages}
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      tableFooter={
        <DataTablePagination
          page={sourcesData.currentPage + 1}
          totalPages={sourcesData.totalPages}
          onPageChange={onPageChange}
          className="px-4 py-3 md:px-6 md:py-1.5"
        />
      }
    />
  );
}

export function SourceContents({
  sourcesData,
  startDate,
  endDate,
  onPageChange,
  sortDescriptor,
  onSortChange,
}: {
  sourcesData: PaginatedResult<SourceContent>;
  startDate: string;
  endDate: string;
  onPageChange: (page: number) => void;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
}) {
  const { currentProject, currentCompetitors } = usePrivateLayoutContext();
  if (!currentProject) return null;
  if (!sourcesData.data.length) return <EmptyState title="No sources found" />;

  return (
    <SourceContentsTable
      project={currentProject}
      competitors={currentCompetitors}
      sources={sourcesData.data}
      startDate={startDate}
      endDate={endDate}
      totalPages={sourcesData.totalPages}
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      tableFooter={
        <DataTablePagination
          page={sourcesData.currentPage + 1}
          totalPages={sourcesData.totalPages}
          onPageChange={onPageChange}
          className="px-4 py-3 md:px-6 md:py-1.5"
        />
      }
    />
  );
}

export function SourceDomainsTable({
  sources,
  totalPages,
  isLoading,
  error,
  tableHeader,
  tableFooter,
  sortDescriptor,
  onSortChange,
  hideSorting,
}: {
  sources: SourceDomain[];
  totalPages?: number;
  isLoading?: boolean;
  error?: Error;
  tableHeader?: React.ReactNode;
  tableFooter?: React.ReactNode;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  hideSorting?: boolean;
}) {
  const columns = useMemo(() => createSourceDomainsTableColumnDefs(!hideSorting), [hideSorting]);
  const domainsTable = useReactTable({
    columns,
    data: sources,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.hostname,
    meta: {} as SourceDomainsTableMeta,
  });

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading sources</div>;

  return (
    <StandardTable
      reactTable={domainsTable}
      ariaLabel="Source Domains List"
      tableHeader={tableHeader}
      tableFooter={tableFooter}
      emptyStateTitle="No sources found"
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      hideSorting={hideSorting}
    />
  );
}

export function SourceContentsTable({
  project,
  competitors,
  sources,
  startDate,
  endDate,
  totalPages,
  isLoading,
  error,
  tableHeader,
  tableFooter,
  sortDescriptor,
  onSortChange,
  hideSorting,
}: {
  project: ProjectRow;
  competitors: CompetitorRow[];
  sources: SourceContent[];
  startDate?: string;
  endDate?: string;
  totalPages?: number;
  isLoading?: boolean;
  error?: Error;
  tableHeader?: React.ReactNode;
  tableFooter?: React.ReactNode;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  hideSorting?: boolean;
}) {
  const columns = useMemo(() => createSourceContentsTableColumnDefs(!hideSorting), [hideSorting]);
  const contentsTable = useReactTable({
    columns,
    data: sources,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.url,
    meta: { project, competitors, startDate, endDate } as SourceContentsTableMeta,
  });

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading sources</div>;

  return (
    <StandardTable
      reactTable={contentsTable}
      ariaLabel="Source Contents List"
      tableHeader={tableHeader}
      tableFooter={tableFooter}
      emptyStateTitle="No sources found"
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      hideSorting={hideSorting}
    />
  );
}
