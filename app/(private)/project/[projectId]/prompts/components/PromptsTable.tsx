'use client';

import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { RouteHelper } from '@/libs/routes';
import { createPromptsTableColumnDefs, PromptsTableMeta } from './promptsTableColumnDefs';
import { DateRangePickerCard } from '../../overview/components/DateRangePickerCard';
import { parseDate } from '@internationalized/date';
import { DateRangePickerValue } from '@/components/application/date-picker/range-calendar';
import { useRouter } from 'next/navigation';
import { PromptAndTopicJoinRow } from '@/libs/database/Prompts/types';
import { TopicRow, CUSTOM_TOPIC_NAME } from '@/libs/database/Topics/types';
import { PromptAnalysis } from '@/app/api/project/[projectId]/prompts/getPromptsAnalysis';
import { Button } from '@/components/base/buttons/button';
import { Badge } from '@/components/base/badges/badges';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { ExportActionsButton } from '@/app/(private)/components/ExportActionsButton';
import { exportPromptsToCsv } from '@/app/(private)/project/[projectId]/prompts/utils/exportPromptsCsv';
import { NewPromptSlideoutMenu } from './NewPromptSlideoutMenu';
import { EditPromptSlideoutMenu } from './EditPromptSlideoutMenu';
import { TopicsSlideoutMenu } from './TopicsSlideoutMenu';
import { SUPPORTED_CHATBOTS_IDS, CHATBOT_DISPLAY_LABELS } from '@/libs/database/shared/ChatbotId';
import { ISODateString } from '@/libs/database/shared/ISODateString';
import { appFetch } from '@/hooks/appFetch';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import StandardTable, {
  StandardTableFooterContainer,
} from '@/app/(private)/components/StandardTable/StandardTable';
import { SortDirection } from '@/libs/utils/PaginatedResult';
import type { SortDescriptor } from 'react-aria-components';
import type { PromptsSortField } from '../page';
import FetchNewPromptResponsesBanner from './FetchNewPromptResponsesBanner';
import {
  TextFilter,
  MultiSelectFilter,
  FilterBar,
  FilterToggle,
  encodeTextFilter,
  encodeMultiSelectFilter,
} from '@/app/(private)/components/ColumnFilters';

export default function PromptsTable({
  projectId,
  startDate,
  endDate,
  promptsData,
  analysisData,
  shouldShowArchived,
  archivedPromptsCount,
  sortBy,
  sortDir,
  topics,
  topicCounts = {},
  filters = {},
}: {
  projectId: string;
  startDate: ISODateString;
  endDate: ISODateString;
  promptsData: PromptAndTopicJoinRow[];
  analysisData: Record<string, PromptAnalysis>;
  shouldShowArchived: boolean;
  archivedPromptsCount: number;
  sortBy?: PromptsSortField;
  sortDir?: SortDirection;
  topics: TopicRow[];
  topicCounts?: Record<string, number>;
  filters?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const {
    currentProject,
    currentCompetitors,
    currentPrompts,
    addPrompt,
    updatePrompt,
    archivePrompt,
  } = usePrivateLayoutContext();

  const [editTargetPromptRow, setEditTargetPromptRow] = useState<PromptAndTopicJoinRow>();
  const [isAddPromptModalOpen, setIsAddPromptModalOpen] = useState(false);
  const [isEditPromptModalOpen, setIsEditPromptModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [topicsState, setTopicsState] = useState<TopicRow[]>(topics);

  const activeTopicsSorted = useMemo(
    () =>
      topicsState
        .filter((t) => !t.is_archived)
        .sort((a, b) => (a.name === CUSTOM_TOPIC_NAME ? 1 : b.name === CUSTOM_TOPIC_NAME ? -1 : 0)),
    [topicsState]
  );

  const onDateRangeChange = (value: DateRangePickerValue) =>
    router.push(
      RouteHelper.Project.getPrompts(
        projectId,
        value.start.toString(),
        value.end.toString(),
        shouldShowArchived ? 'true' : undefined,
        sortBy,
        sortDir,
        filters
      )
    );

  const onSortChange = (descriptor: SortDescriptor) => {
    // Third click on the same column (descending → ascending would loop): reset to default
    if (
      descriptor.column === sortBy &&
      descriptor.direction === 'ascending' &&
      sortDir === 'desc'
    ) {
      router.push(
        RouteHelper.Project.getPrompts(
          projectId,
          startDate,
          endDate,
          shouldShowArchived ? 'true' : undefined,
          undefined,
          undefined,
          filters
        )
      );
      return;
    }
    const newSortBy = descriptor.column as PromptsSortField | undefined;
    const newSortDir = descriptor.direction === 'ascending' ? 'asc' : 'desc';
    router.push(
      RouteHelper.Project.getPrompts(
        projectId,
        startDate,
        endDate,
        shouldShowArchived ? 'true' : undefined,
        newSortBy,
        newSortDir,
        filters
      )
    );
  };

  const onArchive = useCallback(
    async (promptId: string) => {
      try {
        await appFetch(
          RouteHelper.Api.Project.getPromptsArchive(projectId),
          {
            method: 'POST',
            body: JSON.stringify({ promptId, action: 'archive' }),
          },
          'Failed to archive prompt'
        );

        archivePrompt(promptId);
        showSuccessAlertToast('Prompt archived', 'The prompt has been archived');
        router.refresh();
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    },
    [archivePrompt, projectId, router]
  );

  const onRestore = useCallback(
    async (promptId: string) => {
      try {
        const restoredPrompt = await appFetch<PromptAndTopicJoinRow>(
          RouteHelper.Api.Project.getPromptsArchive(projectId),
          {
            method: 'POST',
            body: JSON.stringify({ promptId, action: 'restore' }),
          },
          'Failed to restore prompt'
        );
        if (!restoredPrompt) return;

        addPrompt(restoredPrompt);
        showSuccessAlertToast('Prompt restored', 'The prompt has been restored');
        router.refresh();
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    },
    [addPrompt, projectId, router]
  );

  const toggleShowArchived = () =>
    router.push(
      RouteHelper.Project.getPrompts(
        projectId,
        startDate,
        endDate,
        shouldShowArchived ? undefined : 'true',
        sortBy,
        sortDir,
        filters
      )
    );

  const columns = useMemo(() => createPromptsTableColumnDefs(true), []);
  const table = useReactTable({
    columns,
    data: promptsData,
    rowCount: promptsData.length,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    meta: {
      projectId,
      analysis: analysisData ?? {},
      project: currentProject,
      competitors: currentCompetitors,
      startDate,
      endDate,
      onArchive,
      onRestore,
      onEdit: (promptId: string) => {
        const promptRow = promptsData.find((prompt) => prompt.id === promptId);
        if (!promptRow) return;
        setEditTargetPromptRow(promptRow);
        setIsEditPromptModalOpen(true);
      },
    } as PromptsTableMeta,
  });

  const activePromptsCount = promptsData?.filter((prompt) => !prompt.is_archived).length ?? 0;
  const selectedDateRange = { start: parseDate(startDate), end: parseDate(endDate) };

  const sortDescriptor: SortDescriptor | undefined = sortBy
    ? { column: sortBy, direction: sortDir === 'desc' ? 'descending' : 'ascending' }
    : undefined;

  const onExportCsv = () => {
    if (!currentProject) return;
    exportPromptsToCsv(
      promptsData,
      analysisData,
      currentProject,
      currentCompetitors,
      projectId,
      startDate,
      endDate
    );
  };

  // Filter values
  const nameFilter = filters['filter_name'];
  const topicFilter = filters['filter_topic_name']
    ? filters['filter_topic_name'].split(',').filter(Boolean)
    : [];
  const chatbotFilterValues = filters['filter_chatbot']
    ? filters['filter_chatbot'].split(',').filter(Boolean)
    : [];

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const topicOptions = useMemo(
    () =>
      topicsState
        .filter((t) => !t.is_archived)
        .map((t) => ({ id: t.name, label: t.name, count: topicCounts[t.name] })),
    [topicsState, topicCounts]
  );

  const navigate = (newFilters: Record<string, string | undefined>) =>
    router.push(
      RouteHelper.Project.getPrompts(
        projectId,
        startDate,
        endDate,
        shouldShowArchived ? 'true' : undefined,
        sortBy,
        sortDir,
        newFilters
      )
    );

  const onNameChange = (value: string | undefined) =>
    navigate({ ...filters, filter_name: encodeTextFilter(value) });

  const onTopicChange = (ids: string[]) =>
    navigate({ ...filters, filter_topic_name: encodeMultiSelectFilter(ids) });

  const chatbotOptions = SUPPORTED_CHATBOTS_IDS.map((id) => ({
    id,
    label: CHATBOT_DISPLAY_LABELS[id],
  }));

  const onChatbotChange = (ids: string[]) =>
    navigate({ ...filters, filter_chatbot: encodeMultiSelectFilter(ids) });

  const onClearAllFilters = () =>
    router.push(
      RouteHelper.Project.getPrompts(
        projectId,
        startDate,
        endDate,
        shouldShowArchived ? 'true' : undefined,
        sortBy,
        sortDir,
        {}
      )
    );

  if (!currentProject) return null;

  const hasPromptsWithNoResponses = promptsData
    .filter((p) => !p.is_archived)
    .some((p) => (analysisData[p.id]?.count ?? 0) === 0);

  return (
    <>
      <div className="mb-4">
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <DateRangePickerCard
              selectedDateRange={selectedDateRange}
              onApplyAction={onDateRangeChange}
            />
            <Button color="secondary" size="sm" onClick={() => setIsAddPromptModalOpen(true)}>
              New Prompt
            </Button>
            <Button color="secondary" size="sm" onClick={() => setIsTopicsModalOpen(true)}>
              Topics
            </Button>
            <ExportActionsButton onExportCsvAction={onExportCsv} />
            <FilterToggle
              isExpanded={isFiltersExpanded}
              onToggle={() => setIsFiltersExpanded((prev) => !prev)}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <Badge type="pill-color" size="sm" color="gray">
            {activePromptsCount} {activePromptsCount === 1 ? 'prompt' : 'prompts'}
          </Badge>
        </div>

        <FilterBar isExpanded={isFiltersExpanded} hasActiveFilters={hasActiveFilters} onClearAll={onClearAllFilters}>
          <TextFilter
            label="Text"
            value={nameFilter}
            onChange={onNameChange}
            placeholder="Filter by text..."
          />
          {topicOptions.length > 0 && (
            <MultiSelectFilter
              label="Topic"
              options={topicOptions}
              selectedIds={topicFilter}
              onChange={onTopicChange}
            />
          )}
          <MultiSelectFilter
            label="Chatbot"
            options={chatbotOptions}
            selectedIds={chatbotFilterValues}
            onChange={onChatbotChange}
          />
        </FilterBar>
      </div>

      <StandardTable
        reactTable={table}
        ariaLabel="Prompts List"
        sortDescriptor={sortDescriptor}
        onSortChange={onSortChange}
        tableFooter={
          !!archivedPromptsCount && (
            <StandardTableFooterContainer>
              <Button color="tertiary" size="xs" onClick={toggleShowArchived}>
                {shouldShowArchived ? 'Hide archived' : `View archived (${archivedPromptsCount})`}
              </Button>
            </StandardTableFooterContainer>
          )
        }
        emptyStateTitle="No prompts found"
        emptyStateActionTitle={archivedPromptsCount ? 'View archived' : 'Add new'}
        emptyStateAction={
          archivedPromptsCount ? toggleShowArchived : () => setIsAddPromptModalOpen(true)
        }
      />

      {hasPromptsWithNoResponses && !isBannerDismissed && (
        <div className="mt-4">
          <FetchNewPromptResponsesBanner
            projectId={projectId}
            onClose={() => setIsBannerDismissed(true)}
          />
        </div>
      )}

      <NewPromptSlideoutMenu
        isOpen={isAddPromptModalOpen}
        setIsOpen={setIsAddPromptModalOpen}
        existingPrompts={currentPrompts.map((p) => p.name)}
        projectId={projectId}
        topics={activeTopicsSorted}
        project={currentProject!}
        onSuccess={(prompts) => {
          prompts.forEach((p) => addPrompt(p));
          router.refresh();
        }}
        onTopicAdded={(topic) => {
          setTopicsState((prev) => [...prev, topic]);
          router.refresh();
        }}
        onTopicUpdated={(topicId, topic) => {
          setTopicsState((prev) => prev.map((t) => (t.id === topicId ? topic : t)));
          router.refresh();
        }}
        onTopicArchived={(topicId) => {
          setTopicsState((prev) =>
            prev.map((t) => (t.id === topicId ? { ...t, is_archived: true } : t))
          );
          router.refresh();
        }}
        onTopicUnarchived={(topic) => {
          setTopicsState((prev) => prev.map((t) => (t.id === topic.id ? topic : t)));
          router.refresh();
        }}
      />

      <EditPromptSlideoutMenu
        isOpen={isEditPromptModalOpen}
        setIsOpen={setIsEditPromptModalOpen}
        existingPrompts={currentPrompts.map((p) => p.name)}
        promptName={editTargetPromptRow?.name ?? ''}
        promptId={editTargetPromptRow?.id ?? ''}
        projectId={projectId}
        topics={activeTopicsSorted}
        currentTopicId={editTargetPromptRow?.topic_id}
        onSuccess={(prompt) => {
          updatePrompt(prompt.id, prompt);
          setIsEditPromptModalOpen(false);
          router.refresh();
        }}
      />

      <TopicsSlideoutMenu
        isOpen={isTopicsModalOpen}
        setIsOpen={setIsTopicsModalOpen}
        projectId={projectId}
        topics={topicsState}
        project={currentProject!}
        onTopicAdded={(topic) => {
          setTopicsState((prev) => [...prev, topic]);
          router.refresh();
        }}
        onTopicUpdated={(topicId, topic) => {
          setTopicsState((prev) => prev.map((t) => (t.id === topicId ? topic : t)));
          router.refresh();
        }}
        onTopicArchived={(topicId) => {
          setTopicsState((prev) =>
            prev.map((t) => (t.id === topicId ? { ...t, is_archived: true } : t))
          );
          router.refresh();
        }}
        onTopicUnarchived={(topic) => {
          setTopicsState((prev) => prev.map((t) => (t.id === topic.id ? topic : t)));
          router.refresh();
        }}
      />
    </>
  );
}
