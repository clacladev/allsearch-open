import { createColumnHelper } from '@tanstack/react-table';
import { Table } from '@/components/application/table/table';
import { SourceDomain } from '@/libs/utils/project-analysis/getSourceDomainsSummary';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { DOMAIN_CATEGORIES_COLORS } from './helpers';
import { Tooltip } from '@/app/(private)/components/Tooltip';
import SmallProgressBar from './SmallProgressBar';

export interface SourceDomainsTableMeta {}

const columnHelper = createColumnHelper<SourceDomain>();

export const createSourceDomainsTableColumnDefs = (allowsSorting: boolean) => [
  columnHelper.accessor((row) => row, {
    id: 'hostname',
    header: () => (
      <Table.Head
        id="hostname"
        label="Domain"
        tooltip="Domain name of the source"
        isRowHeader
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { hostname } = info.getValue();
      return (
        <a
          href={`https://${hostname}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-primary max-w-100 truncate text-xs font-medium whitespace-nowrap"
        >
          {hostname}
        </a>
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
