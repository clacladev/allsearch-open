'use client';

import { RouteHelper } from '@/libs/routes';
import { PaginatedResult } from '@/libs/utils/PaginatedResult';
import { DateRangePickerCard } from '../../overview/components/DateRangePickerCard';
import { parseDate } from '@internationalized/date';
import { DateRangePickerValue } from '@/components/application/date-picker/range-calendar';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SourcesType } from '@/app/(private)/project/[projectId]/sources/components/types';
import { SourceDomain } from '@/libs/utils/project-analysis/getSourceDomainsSummary';
import SourcesTypeButtonGroup from './SourcesTypeButtonGroup';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { ExportActionsButton } from '@/app/(private)/components/ExportActionsButton';
import {
  exportSourceDomainsToCsv,
  exportSourceContentsToCsv,
} from '@/app/(private)/project/[projectId]/sources/utils/exportSourcesCsv';
import { SourceContents, SourceDomains } from './SourcesTable';
import { ISODateString } from '@/libs/database/shared/ISODateString';
import { Badge } from '@/components/base/badges/badges';
import type { SortDescriptor } from 'react-aria-components';
import {
  TextFilter,
  MultiSelectFilter,
  NumberRangeFilter,
  FilterBar,
  FilterToggle,
  encodeTextFilter,
  encodeMultiSelectFilter,
  encodeNumberRangeFilter,
} from '@/app/(private)/components/ColumnFilters';
import type { DomainCategory } from '@/libs/utils/project-analysis/domain-categories';
import { SUPPORTED_CHATBOTS_IDS, CHATBOT_DISPLAY_LABELS } from '@/libs/database/shared/ChatbotId';

const DOMAIN_CATEGORIES: DomainCategory[] = ['You', 'UGC', 'Institutional', 'Editorial', 'Other'];

export default function Sources({
  projectId,
  sourceType,
  startDate,
  endDate,
  sourceDomainsData,
  sourceContentsData,
  sortBy,
  sortDir,
  categoryCounts = {},
  mentionedCounts,
  filters = {},
}: {
  projectId: string;
  sourceType: SourcesType;
  startDate: ISODateString;
  endDate: ISODateString;
  sourceDomainsData?: PaginatedResult<SourceDomain>;
  sourceContentsData?: PaginatedResult<SourceContent>;
  sortBy?: string;
  sortDir?: string;
  categoryCounts?: Record<string, number>;
  mentionedCounts?: { mentioned: number; notMentioned: number };
  filters?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const { currentProject, currentCompetitors } = usePrivateLayoutContext();
  const selectedDateRange = { start: parseDate(startDate), end: parseDate(endDate) };
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const getSourceUrl =
    sourceType === 'contents'
      ? RouteHelper.Project.getSourcesContents
      : RouteHelper.Project.getSourcesDomains;

  const onDateRangeChange = (value: DateRangePickerValue) =>
    router.push(
      getSourceUrl(
        projectId,
        value.start.toString(),
        value.end.toString(),
        undefined,
        sortBy,
        sortDir,
        filters
      )
    );

  const onPageChange = (value: number) =>
    router.push(
      getSourceUrl(
        projectId,
        selectedDateRange.start.toString(),
        selectedDateRange.end.toString(),
        value - 1,
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
        getSourceUrl(
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
    const newSortBy = descriptor.column as string | undefined;
    const newSortDir = descriptor.direction === 'ascending' ? 'asc' : 'desc';
    router.push(
      getSourceUrl(
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

  const onSourceTypeChange = (value: SourcesType) => {
    const getSourceUrl =
      value === 'contents'
        ? RouteHelper.Project.getSourcesContents
        : RouteHelper.Project.getSourcesDomains;

    router.push(
      getSourceUrl(projectId, selectedDateRange.start.toString(), selectedDateRange.end.toString())
    );
  };

  const sortDescriptor: SortDescriptor | undefined = sortBy
    ? { column: sortBy, direction: sortDir === 'asc' ? 'ascending' : 'descending' }
    : undefined;

  const onExportCsv = () => {
    if (!currentProject) return;
    if (sourceType === 'domains' && sourceDomainsData) {
      exportSourceDomainsToCsv(sourceDomainsData.data, startDate, endDate);
    } else if (sourceType === 'contents' && sourceContentsData) {
      exportSourceContentsToCsv(
        sourceContentsData.data,
        currentProject,
        currentCompetitors,
        startDate,
        endDate
      );
    }
  };

  // Build category options with counts
  const domainCategoryOptions = DOMAIN_CATEGORIES.map((c) => ({
    id: c,
    label: c,
    count: categoryCounts[c],
  }));

  // Build mentioned options with counts
  const mentionedOptions = mentionedCounts
    ? [
        { id: 'Mentioned', label: 'Mentioned', count: mentionedCounts.mentioned },
        { id: 'Not mentioned', label: 'Not mentioned', count: mentionedCounts.notMentioned },
      ]
    : [];

  // Parse current filter values
  const hostnameFilter = filters['filter_hostname'];
  const titleFilter = filters['filter_title'];
  const domainCategoryFilter = filters['filter_domainCategory']
    ? filters['filter_domainCategory'].split(',').filter(Boolean)
    : [];
  const usedPercentageFilter = parseRangeParam(filters['filter_usedPercentage']);
  const citedPercentageFilter = parseRangeParam(filters['filter_citedPercentage']);
  const mentionedFilter = filters['filter_mentioned']
    ? filters['filter_mentioned'].split(',').filter(Boolean)
    : [];

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const navigate = (newFilters: Record<string, string | undefined>) =>
    router.push(
      getSourceUrl(
        projectId,
        startDate,
        endDate,
        0,
        sortBy,
        sortDir,
        newFilters
      )
    );

  const onHostnameChange = (value: string | undefined) =>
    navigate({ ...filters, filter_hostname: encodeTextFilter(value) });

  const onTitleChange = (value: string | undefined) =>
    navigate({ ...filters, filter_title: encodeTextFilter(value) });

  const onDomainCategoryChange = (ids: string[]) =>
    navigate({ ...filters, filter_domainCategory: encodeMultiSelectFilter(ids) });

  const onUsedPercentageChange = (min: number | undefined, max: number | undefined) =>
    navigate({ ...filters, filter_usedPercentage: encodeNumberRangeFilter(min, max) });

  const onCitedPercentageChange = (min: number | undefined, max: number | undefined) =>
    navigate({ ...filters, filter_citedPercentage: encodeNumberRangeFilter(min, max) });

  const onMentionedChange = (ids: string[]) =>
    navigate({ ...filters, filter_mentioned: encodeMultiSelectFilter(ids) });

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
      getSourceUrl(projectId, startDate, endDate, 0, sortBy, sortDir, {})
    );

  if (!currentProject) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <DateRangePickerCard
              selectedDateRange={selectedDateRange}
              onApplyAction={onDateRangeChange}
            />
            <SourcesTypeButtonGroup
              sourceType={sourceType}
              onSourceTypeChangeAction={onSourceTypeChange}
            />
            <ExportActionsButton onExportCsvAction={onExportCsv} />
            <FilterToggle
              isExpanded={isFiltersExpanded}
              onToggle={() => setIsFiltersExpanded((prev) => !prev)}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <Badge type="pill-color" size="sm" color="brand">
            {sourceContentsData?.totalItems ?? sourceDomainsData?.totalItems ?? 0} sources
          </Badge>
        </div>

        <FilterBar isExpanded={isFiltersExpanded} hasActiveFilters={hasActiveFilters} onClearAll={onClearAllFilters}>
        {sourceType === 'domains' && (
          <>
            <TextFilter
              label="Hostname"
              value={hostnameFilter}
              onChange={onHostnameChange}
              placeholder="Filter by hostname..."
            />
            <MultiSelectFilter
              label="Category"
              options={domainCategoryOptions}
              selectedIds={domainCategoryFilter}
              onChange={onDomainCategoryChange}
            />
            <MultiSelectFilter
              label="Chatbot"
              options={chatbotOptions}
              selectedIds={chatbotFilterValues}
              onChange={onChatbotChange}
            />
            <NumberRangeFilter
              label="Used %"
              min={usedPercentageFilter.min}
              max={usedPercentageFilter.max}
              onChange={onUsedPercentageChange}
              unit="%"
            />
            <NumberRangeFilter
              label="Cited %"
              min={citedPercentageFilter.min}
              max={citedPercentageFilter.max}
              onChange={onCitedPercentageChange}
              unit="%"
            />
          </>
        )}
        {sourceType === 'contents' && (
          <>
            <TextFilter
              label="Title"
              value={titleFilter}
              onChange={onTitleChange}
              placeholder="Filter by title..."
            />
            <MultiSelectFilter
              label="Category"
              options={domainCategoryOptions}
              selectedIds={domainCategoryFilter}
              onChange={onDomainCategoryChange}
            />
            <MultiSelectFilter
              label="Chatbot"
              options={chatbotOptions}
              selectedIds={chatbotFilterValues}
              onChange={onChatbotChange}
            />
            <NumberRangeFilter
              label="Used %"
              min={usedPercentageFilter.min}
              max={usedPercentageFilter.max}
              onChange={onUsedPercentageChange}
              unit="%"
            />
            <NumberRangeFilter
              label="Cited %"
              min={citedPercentageFilter.min}
              max={citedPercentageFilter.max}
              onChange={onCitedPercentageChange}
              unit="%"
            />
            <MultiSelectFilter
              label="Mentioned"
              options={mentionedOptions}
              selectedIds={mentionedFilter}
              onChange={onMentionedChange}
            />
          </>
        )}
        </FilterBar>
      </div>

      {sourceDomainsData ? (
        <SourceDomains
          sourcesData={sourceDomainsData}
          onPageChange={onPageChange}
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
        />
      ) : sourceContentsData ? (
        <SourceContents
          sourcesData={sourceContentsData}
          onPageChange={onPageChange}
          startDate={startDate}
          endDate={endDate}
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
        />
      ) : null}
    </div>
  );
}

function parseRangeParam(value: string | undefined): { min?: number; max?: number } {
  if (!value) return {};
  const [minStr, maxStr] = value.split(',');
  const min = minStr && minStr.trim() ? Number(minStr.trim()) : undefined;
  const max = maxStr && maxStr.trim() ? Number(maxStr.trim()) : undefined;
  return {
    min: min !== undefined && !isNaN(min) ? min : undefined,
    max: max !== undefined && !isNaN(max) ? max : undefined,
  };
}
