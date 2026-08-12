import { createColumnHelper } from '@tanstack/react-table';
import { DataTableColumns as Table } from '@/components/shared/data-table';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { DOMAIN_CATEGORIES_COLORS } from '../../sources/components/helpers';
import { Tooltip } from '@/app/(private)/components/Tooltip';
import Link from 'next/link';
import { RouteHelper } from '@/libs/routes';
import SmallProgressBar from '../../sources/components/SmallProgressBar';

export interface BrandsSourcesTableMeta {
  projectId: string;
  startDate: string;
  endDate: string;
}

const columnHelper = createColumnHelper<SourceContent>();

export const createBrandsSourcesTableColumnDefs = (allowsSorting: boolean) => [
  columnHelper.accessor((row) => row, {
    id: 'title',
    header: () => (
      <Table.Head
        id="title"
        label="URL"
        tooltip="URL of the source"
        isRowHeader
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { id, title, cleanUrl } = info.getValue();
      const { projectId, startDate, endDate } = info.table.options.meta as BrandsSourcesTableMeta;
      return (
        <Link
          href={RouteHelper.Project.getSourceDetails(projectId, id, startDate, endDate, title)}
          className="flex max-w-100 flex-col text-xs font-medium"
        >
          <div className="text-primary truncate">{title}</div>
          <div className="text-secondary truncate">{cleanUrl}</div>
        </Link>
      );
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'domainCategory',
    header: () => (
      <Table.Head
        id="domainCategory"
        label="Category"
        tooltip="Category of the source"
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { domainCategory } = info.getValue();
      return (
        <BadgeWithDot size="sm" color={DOMAIN_CATEGORIES_COLORS[domainCategory]} type="modern">
          {domainCategory}
        </BadgeWithDot>
      );
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'usedPercentage',
    header: () => (
      <Table.Head
        id="usedPercentage"
        label="Used %"
        tooltip="Percentage of times the source was used"
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { usedPercentage, usedCount } = info.getValue();
      return (
        <Tooltip
          title={`Used ${usedPercentage}% of the times`}
          description={`Total of ${usedCount} times`}
        >
          <div className="flex items-center gap-2">
            <span className="text-tertiary text-xs">{usedPercentage}%</span>
            <SmallProgressBar value={usedPercentage} />
          </div>
        </Tooltip>
      );
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'citedPercentage',
    header: () => (
      <Table.Head
        id="citedPercentage"
        label="Cited %"
        tooltip="Percentage of times the source was cited"
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { citedPercentage, citedCount } = info.getValue();
      return (
        <Tooltip
          title={`Cited ${citedPercentage}% of the times`}
          description={`Total of ${citedCount} times`}
        >
          <div className="flex items-center gap-2">
            <span className="text-tertiary text-xs">{citedPercentage}%</span>
            <SmallProgressBar value={citedPercentage} />
          </div>
        </Tooltip>
      );
    },
  }),
];
