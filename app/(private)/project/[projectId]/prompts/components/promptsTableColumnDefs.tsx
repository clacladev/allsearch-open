import { Badge } from '@/components/base/badges/badges';
import { BADGE_COLORS } from '@/components/base/badges/badge-types';
import { ButtonUtility } from '@/components/base/buttons/button-utility';
import { PromptAndTopicJoinRow } from '@/libs/database/Prompts/types';
import { createColumnHelper } from '@tanstack/react-table';
import { Edit01, RefreshCcw01, Trash01 } from '@untitledui/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { stringToNumber } from '@/libs/utils/stringToNumber';
import { RouteHelper } from '@/libs/routes';
import Link from 'next/link';
import { PromptAnalysis } from '@/app/api/project/[projectId]/prompts/getPromptsAnalysis';
import { DataTableColumns as Table } from '@/components/shared/data-table';
import { BrandPositionBadge } from '@/app/(private)/project/[projectId]/sources/components/BrandPositionBadge';
import { SentimentIcon } from '@/app/(private)/project/[projectId]/components/SentimentIcon';
import { BrandsIconsStackWithTooltip } from '@/app/(private)/project/[projectId]/sources/components/BrandsIconsStack';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { isDefaultDateRange } from '@/libs/utils/searchParamsHelpers';

dayjs.extend(relativeTime);

export interface PromptsTableMeta {
  projectId: string;
  analysis: Record<string, PromptAnalysis>;
  project?: ProjectRow;
  competitors: CompetitorRow[];
  startDate?: string;
  endDate?: string;
  onArchive: (promptId: string) => void;
  onRestore: (promptId: string) => void;
  onEdit: (promptId: string) => void;
}

const columnHelper = createColumnHelper<PromptAndTopicJoinRow>();

export const createPromptsTableColumnDefs = (allowsSorting: boolean) => [
  columnHelper.accessor((row) => row, {
    id: 'name',
    header: () => (
      <Table.Head
        id="name"
        label="Prompt"
        tooltip="The prompt text"
        isRowHeader
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { id, name } = info.getValue();
      const { projectId, startDate, endDate } = info.table.options.meta as PromptsTableMeta;
      return (
        <Link
          href={RouteHelper.Project.getPromptDetails(projectId, id, startDate, endDate)}
          className="flex w-80 flex-col text-xs font-medium"
        >
          {name}
        </Link>
      );
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'topic_name',
    header: () => (
      <Table.Head
        id="topic_name"
        label="Topic"
        tooltip="The prompt topic"
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { topic_name } = info.getValue();
      const colorIndex = stringToNumber(topic_name, BADGE_COLORS.length);
      return (
        <Badge color={BADGE_COLORS[colorIndex]} size="sm">
          {topic_name}
        </Badge>
      );
    },
  }),

  columnHelper.accessor((row) => row, {
    id: '# Responses',
    header: (info) => {
      const { startDate, endDate } = info.table.options.meta as PromptsTableMeta;
      return (
        <Table.Head
          id="# Responses"
          label="# Responses"
          tooltip={
            startDate && endDate && !isDefaultDateRange(startDate, endDate)
              ? 'Number of AI responses analyzed in the selected date range'
              : 'Number of AI responses analyzed in the last 30 days'
          }
        />
      );
    },
    cell: (info) => {
      const { id } = info.getValue();
      const { analysis } = info.table.options.meta as PromptsTableMeta;
      const promptAnalysis = analysis[id];
      return (
        <Badge color="gray" size="sm">
          {promptAnalysis?.count ?? 0}
        </Badge>
      );
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'Mention',
    header: () => (
      <Table.Head
        id="Mention"
        label="Mention"
        tooltip="Average position your brand is mentioned at across responses"
      />
    ),
    cell: (info) => {
      const { id } = info.getValue();
      const { analysis } = info.table.options.meta as PromptsTableMeta;
      const promptAnalysis = analysis[id];
      if (!promptAnalysis) return;
      return (
        <BrandPositionBadge projectIdRank={promptAnalysis.projectIdRank} hideWhenNotMentioned />
      );
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'Sentiment',
    header: () => (
      <Table.Head
        id="Sentiment"
        label="Sentiment"
        tooltip="Average sentiment expressed about your brand across responses"
      />
    ),
    cell: (info) => {
      const { id } = info.getValue();
      const { analysis } = info.table.options.meta as PromptsTableMeta;
      const promptAnalysis = analysis[id];
      if (promptAnalysis?.projectSentimentAvg === undefined) return;
      return <SentimentIcon score={promptAnalysis.projectSentimentAvg} />;
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'Brands',
    header: () => (
      <Table.Head
        id="Brands"
        label="Brands"
        tooltip="Brands sorted by their average mention position across responses"
      />
    ),
    cell: (info) => {
      const { id } = info.getValue();
      const { analysis, project, competitors } = info.table.options.meta as PromptsTableMeta;
      const promptAnalysis = analysis[id];
      if (!project) return;
      if (!promptAnalysis?.brandIdsRanking.length) return;
      return (
        <BrandsIconsStackWithTooltip
          brandIdsRanking={promptAnalysis.brandIdsRanking}
          project={project}
          competitors={competitors}
        />
      );
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'created_at',
    header: () => (
      <Table.Head
        id="created_at"
        label="Added"
        tooltip="When the prompt was added"
        allowsSorting={allowsSorting}
      />
    ),
    cell: (info) => {
      const { created_at } = info.getValue();
      return (
        <Badge color="gray" size="sm">
          {dayjs(created_at).fromNow()}
        </Badge>
      );
    },
  }),

  columnHelper.accessor((row) => row, {
    id: 'Actions',
    header: () => <Table.Head id="Actions" label="Actions" />,
    cell: (info) => {
      const { id, is_archived } = info.getValue();
      const { onArchive, onRestore, onEdit } = info.table.options.meta as PromptsTableMeta;

      if (is_archived) {
        return (
          <ButtonUtility
            size="xs"
            color="tertiary"
            tooltip="Restore"
            icon={RefreshCcw01}
            onClick={() => onRestore(id)}
          />
        );
      }

      return (
        <div className="flex gap-0.5">
          <ButtonUtility
            size="xs"
            color="tertiary"
            tooltip="Archive"
            icon={Trash01}
            onClick={() => onArchive(id)}
          />
          <ButtonUtility
            size="xs"
            color="tertiary"
            tooltip="Edit"
            icon={Edit01}
            onClick={() => onEdit(id)}
          />
        </div>
      );
    },
  }),
];
