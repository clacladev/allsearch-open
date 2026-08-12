import { createColumnHelper } from '@tanstack/react-table';
import { Opportunity } from '@/libs/utils/project-analysis/types';
import { DataTableColumns as Table } from '@/components/shared/data-table';
import Link from 'next/link';
import { PromptRow } from '@/libs/database/Prompts/types';
import {
  ActionBadge,
  DIFFICULTY_TOOLTIP,
  DifficultyBadge,
  PRIORITY_SCORE_TOOLTIP,
  PriorityScoreBadge,
} from './Badges';
import { RouteHelper } from '@/libs/routes';
import {
  OPPORTUNITY_TYPE_NAME,
  OPPORTUNITY_TYPE_SHORT_DESCRIPTION,
} from '@/libs/utils/opportunities';

export interface OpportunitiesTableMeta {
  prompts: PromptRow[];
  projectId: string;
  startDate?: string;
  endDate?: string;
}

const columnHelper = createColumnHelper<Opportunity>();

function DescriptionContent({ title, detail }: { title: React.ReactNode; detail: string }) {
  return (
    <>
      <p className="text-primary truncate text-xs font-medium">{title}</p>
      <p className="text-tertiary truncate text-xs">{detail}</p>
    </>
  );
}

export const createOpportunitiesTableColumnDefs = (allowsSorting: boolean) => [
  columnHelper.accessor((row) => row, {
    id: 'type',
    header: () => (
      <Table.Head
        id="type"
        label="Type"
        tooltip="Type of action"
        isRowHeader
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { type } = info.getValue();
      return <ActionBadge opportunityType={type} />;
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'description',
    header: () => (
      <Table.Head
        id="description"
        label="Description"
        tooltip="This is what to do to leverage this opportunity"
      />
    ),
    cell: (info) => {
      const item = info.getValue();
      const { prompts, projectId, startDate, endDate } = info.table.options
        .meta as OpportunitiesTableMeta;

      const content =
        item.type === 'ProjectSourceNotCitedOpportunity' ? (
          <DescriptionContent
            title={OPPORTUNITY_TYPE_SHORT_DESCRIPTION[item.type]}
            detail={`Content: ${item.projectSource?.cleanUrl}`}
          />
        ) : item.type === 'ProjectSourceNeedsImprovementOpportunity' ? (
          <DescriptionContent
            title={OPPORTUNITY_TYPE_SHORT_DESCRIPTION[item.type]}
            detail={`Content: ${item.projectSource?.cleanUrl}`}
          />
        ) : item.type === 'ProjectSourceNotFoundOpportunity' ? (
          <DescriptionContent
            title={OPPORTUNITY_TYPE_SHORT_DESCRIPTION[item.type]}
            detail={`Prompt: ${prompts.find((prompt) => prompt.id === item.promptId)?.name}`}
          />
        ) : item.type === 'ProjectSourceNotConsistentlyFoundOpportunity' ? (
          <DescriptionContent
            title={OPPORTUNITY_TYPE_SHORT_DESCRIPTION[item.type]}
            detail={`Prompt: ${prompts.find((prompt) => prompt.id === item.promptId)?.name}`}
          />
        ) : item.type === 'UgcSourceNeedsImprovementOpportunity' ? (
          <DescriptionContent
            title={OPPORTUNITY_TYPE_SHORT_DESCRIPTION[item.type]}
            detail={`Source: ${item.source.cleanUrl}`}
          />
        ) : undefined;

      if (!content) return;

      const title = `${OPPORTUNITY_TYPE_NAME[item.type]} #${item.id}`;
      const href = RouteHelper.Project.getOpportunityDetails(
        projectId,
        item.id,
        startDate,
        endDate,
        title
      );

      return (
        <Link href={href} className="block max-w-sm">
          {content}
        </Link>
      );
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'priorityScore',
    header: () => (
      <Table.Head
        id="priorityScore"
        label="Priority"
        tooltip={PRIORITY_SCORE_TOOLTIP}
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { priorityScore } = info.getValue();
      return <PriorityScoreBadge priorityScore={priorityScore} />;
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'difficulty',
    header: () => (
      <Table.Head
        id="difficulty"
        label="Difficulty"
        tooltip={DIFFICULTY_TOOLTIP}
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { type } = info.getValue();
      return <DifficultyBadge opportunityType={type} />;
    },
  }),
];
