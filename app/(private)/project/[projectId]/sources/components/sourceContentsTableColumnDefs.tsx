import { createColumnHelper } from '@tanstack/react-table';
import { DataTableColumns as Table } from '@/components/shared/data-table';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/libs/utils/cn';
import { Tooltip } from '@/app/(private)/components/Tooltip';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { ProjectRow } from '@/libs/database/Projects/types';
import Link from 'next/link';
import { RouteHelper } from '@/libs/routes';
import SmallProgressBar from './SmallProgressBar';
import { BrandPositionBadge } from './BrandPositionBadge';
import { BrandsIconsStackWithTooltip } from './BrandsIconsStack';
import { DOMAIN_CATEGORY_DOT_CLASS } from './helpers';

export interface SourceContentsTableMeta {
  project: ProjectRow;
  competitors: CompetitorRow[];
  startDate: string;
  endDate: string;
}

const columnHelper = createColumnHelper<SourceContent>();

export const createSourceContentsTableColumnDefs = (allowsSorting: boolean) => [
  columnHelper.accessor((row) => row, {
    id: 'title',
    meta: { isRowHeader: true },
    header: () => (
      <Table.Head
        id="title"
        label="URL"
        tooltip="URL of the source"
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { id, title, cleanUrl } = info.getValue();
      const { project, startDate, endDate } = info.table.options.meta as SourceContentsTableMeta;
      return (
        <Link
          href={RouteHelper.Project.getSourceDetails(project.id, id, startDate, endDate, title)}
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
        <Badge variant="outline">
          <span
            className={cn('size-1.5 rounded-full', DOMAIN_CATEGORY_DOT_CLASS[domainCategory])}
            aria-hidden="true"
          />
          {domainCategory}
        </Badge>
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

  columnHelper.accessor((row) => row, {
    id: 'projectIdRank',
    header: () => (
      <Table.Head
        id="projectIdRank"
        label="Mention"
        tooltip="Is your brand mentioned in this content?"
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { projectIdRank } = info.getValue();
      return (
        <div className="flex items-center gap-2 text-xs">
          <BrandPositionBadge projectIdRank={projectIdRank} hideWhenNotMentioned />
        </div>
      );
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'brandsRankings',
    header: () => (
      <Table.Head
        id="brandsRankings"
        label="Brands"
        tooltip="Brands mentioned in this content, in order of appearance"
      />
    ),
    cell: (info) => {
      const { brandIdsRanking } = info.getValue();
      const { project, competitors } = info.table.options.meta as SourceContentsTableMeta;
      return (
        <BrandsIconsStackWithTooltip
          brandIdsRanking={brandIdsRanking}
          competitors={competitors}
          project={project}
        />
      );
    },
  }),
];
