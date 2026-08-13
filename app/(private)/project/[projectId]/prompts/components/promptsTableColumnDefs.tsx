import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppTooltip } from '@/components/shared/tooltip';
import { PromptAndTopicJoinRow } from '@/libs/database/Prompts/types';
import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, RefreshCw, Trash2 } from 'lucide-react';
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

const TOPIC_BADGE_CLASSES: string[] = [
  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100',
  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100',
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
];

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
    meta: { isRowHeader: true },
    header: () => (
      <Table.Head
        id="name"
        label="Prompt"
        tooltip="The prompt text"
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
      const colorIndex = stringToNumber(topic_name, TOPIC_BADGE_CLASSES.length);
      return <Badge className={TOPIC_BADGE_CLASSES[colorIndex]}>{topic_name}</Badge>;
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
      return <Badge variant="secondary">{promptAnalysis?.count ?? 0}</Badge>;
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
      return <Badge variant="secondary">{dayjs(created_at).fromNow()}</Badge>;
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
          <AppTooltip content="Restore">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Restore"
              onClick={() => onRestore(id)}
            >
              <RefreshCw />
            </Button>
          </AppTooltip>
        );
      }

      return (
        <div className="flex gap-0.5">
          <AppTooltip content="Archive">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Archive"
              onClick={() => onArchive(id)}
            >
              <Trash2 />
            </Button>
          </AppTooltip>
          <AppTooltip content="Edit">
            <Button variant="ghost" size="icon-xs" aria-label="Edit" onClick={() => onEdit(id)}>
              <Pencil />
            </Button>
          </AppTooltip>
        </div>
      );
    },
  }),
];
