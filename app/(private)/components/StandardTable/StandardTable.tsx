import { Table, TableCard } from '@/components/application/table/table';
import { flexRender, Table as ReactTable } from '@tanstack/react-table';
import { cloneElement, isValidElement } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { EmptyState } from '../EmptyState';
import type { SortDescriptor } from 'react-aria-components';

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
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  hideSorting?: boolean;
}) {
  const headers = reactTable.getFlatHeaders();
  const rows = reactTable.getRowModel().rows;

  return (
    <TableCard.Root size="xs">
      {tableHeader}

      {!!rows.length ? (
        <Table aria-label={ariaLabel} sortDescriptor={sortDescriptor} onSortChange={onSortChange}>
          <Table.Header>
            {headers.map((header) => {
              if (header.isPlaceholder) return null;
              const content = flexRender(header.column.columnDef.header, header.getContext());
              if (isValidElement(content)) {
                return cloneElement(content, {
                  key: header.id,
                  ...(hideSorting && { allowsSorting: false }),
                } as any);
              }
              return <Fragment key={header.id}>{content}</Fragment>;
            })}
          </Table.Header>

          <Table.Body items={rows}>
            {(row) => (
              <Table.Row id={row.id}>
                {row.getVisibleCells().map((item) => (
                  <Table.Cell key={item.id}>
                    {flexRender(item.column.columnDef.cell, item.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      ) : emptyStateTitle ? (
        <EmptyState
          title={emptyStateTitle}
          customActionTitle={emptyStateActionTitle}
          customAction={emptyStateAction}
          variant="compact"
        />
      ) : null}

      {!!rows.length && tableFooter}
    </TableCard.Root>
  );
}

export function StandardTableFooterContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t-secondary flex justify-center border-t px-4 py-1">{children}</div>
  );
}
