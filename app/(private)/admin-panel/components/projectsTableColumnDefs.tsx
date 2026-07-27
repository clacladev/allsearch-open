import { Badge } from '@/components/base/badges/badges';
import { ButtonUtility } from '@/components/base/buttons/button-utility';
import { Table } from '@/components/application/table/table';
import { ProjectRow } from '@/libs/database/Projects/types';
import { createColumnHelper } from '@tanstack/react-table';
import { Archive, Copy01, PauseCircle, PlayCircle, RefreshCcw01, Trash02 } from '@untitledui/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { UsersInfoMap } from './AdminPanelSections';

dayjs.extend(relativeTime);

type AdminProjectRow = Pick<
  ProjectRow,
  'id' | 'name' | 'hostname' | 'is_paused' | 'is_archived' | 'author_id' | 'created_at'
>;

export interface ProjectsTableMeta {
  usersInfo: UsersInfoMap;
  onTogglePause: (projectId: string) => void;
  onArchive: (projectId: string) => void;
  onRestore: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onClone: (projectId: string) => void;
}

const projectsColumnHelper = createColumnHelper<AdminProjectRow>();

export const projectsTableColumnDefs = [
  projectsColumnHelper.accessor('name', {
    id: 'Name',
    header: () => <Table.Head id="Name" label="Name" isRowHeader />,
    cell: (info) => (
      <span
        className="text-primary block max-w-25 truncate text-xs font-medium"
        title={info.getValue()}
      >
        {info.getValue()}
      </span>
    ),
  }),

  projectsColumnHelper.accessor('hostname', {
    id: 'Hostname',
    header: () => <Table.Head id="Hostname" label="Hostname" />,
    cell: (info) => (
      <span className="block max-w-30 truncate text-xs" title={info.getValue()}>
        {info.getValue()}
      </span>
    ),
  }),

  projectsColumnHelper.accessor((row) => row, {
    id: 'Status',
    header: () => <Table.Head id="Status" label="Status" />,
    cell: (info) => {
      const { is_paused, is_archived } = info.getValue();
      if (is_archived)
        return (
          <Badge color="gray" size="sm">
            Archived
          </Badge>
        );
      return (
        <Badge color={is_paused ? 'warning' : 'success'} size="sm">
          {is_paused ? 'Paused' : 'Active'}
        </Badge>
      );
    },
  }),

  projectsColumnHelper.accessor('author_id', {
    id: 'Author',
    header: () => <Table.Head id="Author" label="Author" />,
    cell: (info) => {
      const { usersInfo } = info.table.options.meta as ProjectsTableMeta;
      const email = usersInfo[info.getValue()]?.email;
      return (
        <span className="block max-w-40 truncate text-xs" title={email}>
          {email ?? '—'}
        </span>
      );
    },
  }),

  projectsColumnHelper.accessor('author_id', {
    id: 'Last Active',
    header: () => <Table.Head id="Last Active" label="Last Active" />,
    cell: (info) => {
      const { usersInfo } = info.table.options.meta as ProjectsTableMeta;
      const lastActiveAt = usersInfo[info.getValue()]?.lastActiveAt;
      return (
        <Badge color="gray" size="sm">
          {lastActiveAt ? dayjs(lastActiveAt).fromNow() : 'never'}
        </Badge>
      );
    },
  }),

  projectsColumnHelper.accessor('created_at', {
    id: 'Created',
    header: () => <Table.Head id="Created" label="Created" />,
    cell: (info) => (
      <Badge color="gray" size="sm">
        {dayjs(info.getValue()).fromNow()}
      </Badge>
    ),
  }),

  projectsColumnHelper.accessor((row) => row, {
    id: 'Actions',
    header: () => <Table.Head id="Actions" label="Actions" />,
    cell: (info) => {
      const { id, is_paused, is_archived } = info.getValue();
      const { onTogglePause, onArchive, onRestore, onDelete, onClone } = info.table.options
        .meta as ProjectsTableMeta;

      if (is_archived) {
        return (
          <div className="flex gap-0.5">
            <ButtonUtility
              size="xs"
              color="tertiary"
              tooltip="Restore"
              icon={RefreshCcw01}
              onClick={() => onRestore(id)}
            />
            <ButtonUtility
              size="xs"
              color="tertiary"
              tooltip="Delete permanently"
              icon={Trash02}
              onClick={() => onDelete(id)}
            />
            <ButtonUtility
              size="xs"
              color="tertiary"
              tooltip="Clone"
              icon={Copy01}
              onClick={() => onClone(id)}
            />
          </div>
        );
      }

      return (
        <div className="flex gap-0.5">
          <ButtonUtility
            size="xs"
            color="tertiary"
            tooltip={is_paused ? 'Resume' : 'Pause'}
            icon={is_paused ? PlayCircle : PauseCircle}
            onClick={() => onTogglePause(id)}
          />
          <ButtonUtility
            size="xs"
            color="tertiary"
            tooltip="Archive"
            icon={Archive}
            onClick={() => onArchive(id)}
          />
          <ButtonUtility
            size="xs"
            color="tertiary"
            tooltip="Clone"
            icon={Copy01}
            onClick={() => onClone(id)}
          />
        </div>
      );
    },
  }),
];
