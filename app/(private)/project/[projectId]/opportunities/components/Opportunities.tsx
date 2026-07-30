'use client';

import { RouteHelper } from '@/libs/routes';
import { Opportunity } from '@/libs/utils/project-analysis/types';
import { PaginatedResult } from '@/libs/utils/PaginatedResult';
import * as Paginations from '@/components/application/pagination/pagination';
import { DateRangePickerCard } from '../../overview/components/DateRangePickerCard';
import { parseDate } from '@internationalized/date';
import { DateRangePickerValue } from '@/components/application/date-picker/range-calendar';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { ExportActionsButton } from '@/app/(private)/components/ExportActionsButton';
import { exportOpportunitiesToCsv } from '@/app/(private)/project/[projectId]/opportunities/utils/exportOpportunitiesCsv';
import { OpportunitiesTable } from './OpportunitiesTable';
import { EmptyState } from '@/app/(private)/components/EmptyState';
import { ISODateString } from '@/libs/database/shared/ISODateString';
import { Badge } from '@/components/base/badges/badges';
import type { SortDescriptor } from 'react-aria-components';
import type { OpportunitiesSortField } from '../page';
import {
  MultiSelectFilter,
  FilterBar,
  FilterToggle,
  encodeMultiSelectFilter,
} from '@/app/(private)/components/ColumnFilters';
import type { FilterOption } from '@/app/(private)/components/ColumnFilters';
import {
  SUPPORTED_CHATBOTS_IDS,
  CHATBOT_DISPLAY_LABELS,
  type ChatbotId,
} from '@/libs/database/shared/ChatbotId';
import { ChatbotCoverageCaption } from '@/app/(private)/components/ChatbotCoverageCaption';

const PRIORITY_OPTIONS: FilterOption[] = [
  { id: 'High', label: 'High' },
  { id: 'Medium', label: 'Medium' },
  { id: 'Low', label: 'Low' },
];

const DIFFICULTY_OPTIONS: FilterOption[] = [
  { id: 'Hard', label: 'Hard' },
  { id: 'Medium', label: 'Medium' },
  { id: 'Easy', label: 'Easy' },
];

export function Opportunities({
  projectId,
  startDate,
  endDate,
  opportunitiesData,
  sortBy,
  sortDir,
  typeOptions,
  priorityCounts,
  difficultyCounts,
  filters = {},
  enabledChatbotIds,
}: {
  projectId: string;
  startDate: ISODateString;
  endDate: ISODateString;
  opportunitiesData: PaginatedResult<Opportunity>;
  sortBy?: OpportunitiesSortField;
  sortDir?: string;
  typeOptions: FilterOption[];
  priorityCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
  filters?: Record<string, string | undefined>;
  enabledChatbotIds: ChatbotId[];
}) {
  const router = useRouter();
  const { currentPrompts } = usePrivateLayoutContext();
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const onExportCsv = () =>
    exportOpportunitiesToCsv(opportunitiesData.data, currentPrompts, projectId, startDate, endDate);
  const selectedDateRange = { start: parseDate(startDate), end: parseDate(endDate) };

  const onDateRangeChange = (dateRange: DateRangePickerValue) =>
    router.push(
      RouteHelper.Project.getOpportunities(
        projectId,
        dateRange.start.toString(),
        dateRange.end.toString(),
        undefined,
        sortBy,
        sortDir,
        filters
      )
    );

  const onPageChange = (page: number) =>
    router.push(
      RouteHelper.Project.getOpportunities(
        projectId,
        selectedDateRange.start.toString(),
        selectedDateRange.end.toString(),
        page - 1,
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
        RouteHelper.Project.getOpportunities(
          projectId,
          selectedDateRange.start.toString(),
          selectedDateRange.end.toString(),
          0,
          undefined,
          undefined,
          filters
        )
      );
      return;
    }
    const newSortBy = descriptor.column as OpportunitiesSortField | undefined;
    const newSortDir = descriptor.direction === 'ascending' ? 'asc' : 'desc';
    router.push(
      RouteHelper.Project.getOpportunities(
        projectId,
        selectedDateRange.start.toString(),
        selectedDateRange.end.toString(),
        0,
        newSortBy,
        newSortDir,
        filters
      )
    );
  };

  const sortDescriptor: SortDescriptor | undefined = sortBy
    ? { column: sortBy, direction: sortDir === 'asc' ? 'ascending' : 'descending' }
    : undefined;

  // Parse current filter values
  const typeFilter = filters['filter_type']
    ? filters['filter_type'].split(',').filter(Boolean)
    : [];
  const priorityFilter = filters['filter_priority']
    ? filters['filter_priority'].split(',').filter(Boolean)
    : [];
  const difficultyFilter = filters['filter_difficulty']
    ? filters['filter_difficulty'].split(',').filter(Boolean)
    : [];

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const navigate = (newFilters: Record<string, string | undefined>) =>
    router.push(
      RouteHelper.Project.getOpportunities(
        projectId,
        startDate,
        endDate,
        0,
        sortBy,
        sortDir,
        newFilters
      )
    );

  const onTypeChange = (ids: string[]) =>
    navigate({ ...filters, filter_type: encodeMultiSelectFilter(ids) });

  const onPriorityChange = (ids: string[]) =>
    navigate({ ...filters, filter_priority: encodeMultiSelectFilter(ids) });

  const onDifficultyChange = (ids: string[]) =>
    navigate({ ...filters, filter_difficulty: encodeMultiSelectFilter(ids) });

  const chatbotFilterValues = filters['filter_chatbot']
    ? filters['filter_chatbot'].split(',').filter(Boolean)
    : [];

  const chatbotOptions = SUPPORTED_CHATBOTS_IDS.map((id) => ({
    id,
    label: CHATBOT_DISPLAY_LABELS[id],
  }));

  const onChatbotChange = (ids: string[]) =>
    navigate({ ...filters, filter_chatbot: encodeMultiSelectFilter(ids) });

  const onClearAllFilters = () =>
    router.push(
      RouteHelper.Project.getOpportunities(projectId, startDate, endDate, 0, sortBy, sortDir, {})
    );

  // Build options with counts
  const priorityOptionsWithCounts = PRIORITY_OPTIONS.map((o) => ({
    ...o,
    count: priorityCounts[o.id] ?? 0,
  }));

  const difficultyOptionsWithCounts = DIFFICULTY_OPTIONS.map((o) => ({
    ...o,
    count: difficultyCounts[o.id] ?? 0,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-end justify-between gap-2">
          <div className="flex gap-2">
            <DateRangePickerCard
              selectedDateRange={selectedDateRange}
              onApplyAction={onDateRangeChange}
            />
            <ExportActionsButton onExportCsvAction={onExportCsv} />
            <FilterToggle
              isExpanded={isFiltersExpanded}
              onToggle={() => setIsFiltersExpanded((prev) => !prev)}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge type="pill-color" size="sm" color="brand">
              {opportunitiesData.totalItems} opportunities
            </Badge>
            <ChatbotCoverageCaption enabledChatbotIds={enabledChatbotIds} />
          </div>
        </div>

        <FilterBar isExpanded={isFiltersExpanded} hasActiveFilters={hasActiveFilters} onClearAll={onClearAllFilters}>
          <MultiSelectFilter
            label="Type"
            options={typeOptions}
            selectedIds={typeFilter}
            onChange={onTypeChange}
          />
          <MultiSelectFilter
            label="Priority"
            options={priorityOptionsWithCounts}
            selectedIds={priorityFilter}
            onChange={onPriorityChange}
          />
          <MultiSelectFilter
            label="Difficulty"
            options={difficultyOptionsWithCounts}
            selectedIds={difficultyFilter}
            onChange={onDifficultyChange}
          />
          <MultiSelectFilter
            label="Chatbot"
            options={chatbotOptions}
            selectedIds={chatbotFilterValues}
            onChange={onChatbotChange}
          />
        </FilterBar>
      </div>

      {!!opportunitiesData.data.length ? (
        <OpportunitiesTable
          opportunities={opportunitiesData.data}
          totalPages={opportunitiesData.totalPages}
          prompts={currentPrompts}
          projectId={projectId}
          startDate={selectedDateRange.start.toString()}
          endDate={selectedDateRange.end.toString()}
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
          tableFooter={
            <Paginations.PaginationPageDefault
              page={opportunitiesData.currentPage + 1}
              total={opportunitiesData.totalPages}
              onPageChange={onPageChange}
              className="px-4 py-3 md:px-6 md:py-1.5"
            />
          }
        />
      ) : (
        <EmptyState title="No opportunities found" description="No opportunities found" />
      )}
    </div>
  );
}
