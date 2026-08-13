import { DataTable, type DataTableSort } from '@/components/shared/data-table';
import { Table as ReactTable } from '@tanstack/react-table';
import { EmptyState } from '../EmptyState';

export default function StandardTable<ValueType>({
  reactTable,
  ariaLabel,
  tableHeader,
  tableFooter,
  emptyStateTitle,
  emptyStateActionTitle,
  emptyStateAction,
  sortDescriptor,
  onSortChange,
  hideSorting,
}: {
  reactTable: ReactTable<ValueType>;
  ariaLabel: string;
  tableHeader?: React.ReactNode;
  tableFooter?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateActionTitle?: string;
  emptyStateAction?: () => void;
  sortDescriptor?: DataTableSort;
  onSortChange?: (descriptor: DataTableSort) => void;
  hideSorting?: boolean;
}) {
  const rows = reactTable.getRowModel().rows;

  return (
    <section className="border-border overflow-hidden rounded-xl border bg-card shadow-xs">
      {tableHeader}

      {!!rows.length ? (
        <DataTable reactTable={reactTable} ariaLabel={ariaLabel} sort={sortDescriptor} onSortChange={onSortChange} hideSorting={hideSorting} />
      ) : emptyStateTitle ? (
        <EmptyState
          title={emptyStateTitle}
          customActionTitle={emptyStateActionTitle}
          customAction={emptyStateAction}
          variant="compact"
        />
      ) : null}

      {!!rows.length && tableFooter}
    </section>
  );
}

export function StandardTableFooterContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t-secondary flex justify-center border-t px-4 py-1">{children}</div>
  );
}
