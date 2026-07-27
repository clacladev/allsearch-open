import { Fragment } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Table, TableCard } from '@/components/application/table/table';
import { ProjectRow } from '@/libs/database/Projects/types';
import { projectsTableColumnDefs, ProjectsTableMeta } from './projectsTableColumnDefs';
import { UsersInfoMap } from './AdminPanelSections';

type AdminProjectRow = Pick<
  ProjectRow,
  'id' | 'name' | 'hostname' | 'is_paused' | 'is_archived' | 'author_id' | 'created_at'
>;

export default function ProjectsTable({
  projects,
  usersInfo,
  onTogglePause,
  onArchive,
  onRestore,
  onDelete,
  onClone,
}: {
  projects: AdminProjectRow[];
  usersInfo: UsersInfoMap;
  onTogglePause: (projectId: string) => void;
  onArchive: (projectId: string) => void;
  onRestore: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onClone: (projectId: string) => void;
}) {
  const projectsTable = useReactTable({
    columns: projectsTableColumnDefs,
    data: projects,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: { usersInfo, onTogglePause, onArchive, onRestore, onDelete, onClone } as ProjectsTableMeta,
  });

  return (
    <TableCard.Root size="xs">
      <Table aria-label="Projects">
        <Table.Header>
          {projectsTable.getFlatHeaders().map((header) => (
            <Fragment key={header.id}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </Fragment>
          ))}
        </Table.Header>

        <Table.Body items={projectsTable.getRowModel().rows}>
          {(row) => (
            <Table.Row id={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Table.Cell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Cell>
              ))}
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </TableCard.Root>
  );
}
