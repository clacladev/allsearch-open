'use client';

import { ArrowDown, ChevronsUpDown } from 'lucide-react';
import { flexRender, type Column, type RowData, type Table as ReactTable } from '@tanstack/react-table';
import { createContext, useContext } from 'react';
import { cn } from '@/libs/utils/cn';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    isRowHeader?: boolean;
  }
}

export type DataTableSort = { column: string | number; direction: 'ascending' | 'descending' };

const DataTableContext = createContext<{
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  hideSorting?: boolean;
}>({});

export function DataTableColumnHeader<T>({
  column,
  id,
  label,
  tooltip,
  allowsSorting = false,
}: {
  column?: Column<T>;
  id?: string;
  label: string;
  tooltip?: string;
  allowsSorting?: boolean;
  isRowHeader?: boolean;
}) {
  const { sort, onSortChange, hideSorting } = useContext(DataTableContext);
  const columnId = column?.id ?? id;
  const direction = sort && sort.column === columnId ? sort.direction : undefined;
  const onClick = () => {
    if (!columnId) return;
    onSortChange?.({ column: columnId, direction: direction === 'ascending' ? 'descending' : 'ascending' });
  };

  if (!allowsSorting || hideSorting) return <span title={tooltip}>{label}</span>;

  return (
    <button type="button" title={tooltip} onClick={onClick} className="flex items-center gap-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {label}
      {direction ? <ArrowDown aria-hidden="true" className={cn('size-3', direction === 'ascending' && 'rotate-180')} /> : <ChevronsUpDown aria-hidden="true" className="size-3" />}
    </button>
  );
}

export const DataTableColumns = { Head: DataTableColumnHeader };

export function DataTable<T>({
  reactTable,
  ariaLabel,
  sort,
  onSortChange,
  hideSorting = false,
}: {
  reactTable: ReactTable<T>;
  ariaLabel: string;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  hideSorting?: boolean;
}) {
  return (
    <DataTableContext.Provider value={{ sort, onSortChange, hideSorting }}>
      <div className="overflow-x-auto">
        <table aria-label={ariaLabel} className="w-full min-w-max text-sm">
          <thead className="h-7 bg-muted/60 text-left text-xs font-semibold text-muted-foreground">
            {reactTable.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id} className="border-border border-b">
              {headerGroup.headers.map((header) => <th key={header.id} scope="col" className="whitespace-nowrap px-4 py-2">
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </th>)}
            </tr>)}
          </thead>
          <tbody>
            {reactTable.getRowModel().rows.map((row) => <tr key={row.id} className="border-border h-12 border-b last:border-0 hover:bg-muted/40">
              {row.getVisibleCells().map((cell) => cell.column.columnDef.meta?.isRowHeader
                ? <th key={cell.id} scope="row" className="px-4 py-2 align-middle">{flexRender(cell.column.columnDef.cell, cell.getContext())}</th>
                : <td key={cell.id} className="px-4 py-2 align-middle">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
    </DataTableContext.Provider>
  );
}
