'use client';

import { RouteHelper } from '@/libs/routes';
import { PaginatedResult } from '@/libs/utils/PaginatedResult';
import { DateRangePickerCard } from '../../overview/components/DateRangePickerCard';
import { parseDate } from '@internationalized/date';
import { DateRangePickerValue } from '@/components/application/date-picker/range-calendar';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExportActionsButton } from '@/app/(private)/components/ExportActionsButton';
import { exportBrandSourcesToCsv } from '../utils/exportBrandSourcesCsv';
import { BrandsSourcesTable } from './BrandsSourcesTable';
import { ISODateString } from '@/libs/database/shared/ISODateString';
import { Badge } from '@/components/base/badges/badges';
import { Button } from '@/components/base/buttons/button';
import { Settings02 } from '@untitledui/icons';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import type { SortDescriptor } from 'react-aria-components';
import { BrandSelector, BrandOption } from './BrandSelector';
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
import {
  SUPPORTED_CHATBOTS_IDS,
  CHATBOT_DISPLAY_LABELS,
  type ChatbotId,
} from '@/libs/database/shared/ChatbotId';
import { ChatbotCoverageCaption } from '@/app/(private)/components/ChatbotCoverageCaption';

const BRANDS_SORT_FIELDS = ['title', 'domainCategory', 'usedPercentage', 'citedPercentage'];

const DOMAIN_CATEGORIES: DomainCategory[] = ['You', 'UGC', 'Institutional', 'Editorial', 'Other'];

export default function Brands({
  projectId,
  startDate,
  endDate,
  sourcesData,
  selectedBrandIds,
  availableBrands,
  sortBy,
  sortDir,
  categoryCounts = {},
  filters = {},
  enabledChatbotIds,
}: {
  projectId: string;
  startDate: ISODateString;
  endDate: ISODateString;
  sourcesData: PaginatedResult<SourceContent>;
  selectedBrandIds: string[];
  availableBrands: BrandOption[];
  sortBy?: string;
  sortDir?: string;
  categoryCounts?: Record<string, number>;
  filters?: Record<string, string | undefined>;
  enabledChatbotIds: ChatbotId[];
}) {
  const router = useRouter();
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const selectedDateRange = { start: parseDate(startDate), end: parseDate(endDate) };

  const onDateRangeChange = (value: DateRangePickerValue) =>
    router.push(
      RouteHelper.Project.getBrands(
        projectId,
        value.start.toString(),
        value.end.toString(),
        selectedBrandIds,
        undefined,
        sortBy,
        sortDir,
        filters
      )
    );

  const onBrandSelectionChange = (brandIds: string[]) =>
    router.push(
      RouteHelper.Project.getBrands(
        projectId,
        startDate,
        endDate,
        brandIds,
        undefined,
        sortBy,
        sortDir,
        filters
      )
    );

  const onPageChange = (value: number) =>
    router.push(
      RouteHelper.Project.getBrands(
        projectId,
        startDate,
        endDate,
        selectedBrandIds,
        value - 1,
        sortBy,
        sortDir,
        filters
      )
    );

  const onSortChange = (descriptor: SortDescriptor) => {
    if (
      descriptor.column === sortBy &&
      descriptor.direction === 'ascending' &&
      sortDir === 'desc'
    ) {
      router.push(
        RouteHelper.Project.getBrands(
          projectId,
          startDate,
          endDate,
          selectedBrandIds,
          0,
          undefined,
          undefined,
          filters
        )
      );
      return;
    }
    const newSortBy = BRANDS_SORT_FIELDS.includes(descriptor.column as string)
      ? (descriptor.column as string)
      : undefined;
    const newSortDir = descriptor.direction === 'ascending' ? 'asc' : 'desc';
    router.push(
      RouteHelper.Project.getBrands(
        projectId,
        startDate,
        endDate,
        selectedBrandIds,
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

  const onExportCsv = () =>
    exportBrandSourcesToCsv(sourcesData.data, projectId, startDate, endDate);

  // Parse current filter values
  const titleFilter = filters['filter_title'];
  const domainCategoryFilter = filters['filter_domainCategory']
    ? filters['filter_domainCategory'].split(',').filter(Boolean)
    : [];
  const usedPercentageFilter = parseRangeParam(filters['filter_usedPercentage']);
  const citedPercentageFilter = parseRangeParam(filters['filter_citedPercentage']);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const navigate = (newFilters: Record<string, string | undefined>) =>
    router.push(
      RouteHelper.Project.getBrands(
        projectId,
        startDate,
        endDate,
        selectedBrandIds,
        0,
        sortBy,
        sortDir,
        newFilters
      )
    );

  const onTitleChange = (value: string | undefined) =>
    navigate({ ...filters, filter_title: encodeTextFilter(value) });

  const onDomainCategoryChange = (ids: string[]) =>
    navigate({ ...filters, filter_domainCategory: encodeMultiSelectFilter(ids) });

  const onUsedPercentageChange = (min: number | undefined, max: number | undefined) =>
    navigate({ ...filters, filter_usedPercentage: encodeNumberRangeFilter(min, max) });

  const onCitedPercentageChange = (min: number | undefined, max: number | undefined) =>
    navigate({ ...filters, filter_citedPercentage: encodeNumberRangeFilter(min, max) });

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
      RouteHelper.Project.getBrands(projectId, startDate, endDate, selectedBrandIds, 0, sortBy, sortDir, {})
    );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <DateRangePickerCard
              selectedDateRange={selectedDateRange}
              onApplyAction={onDateRangeChange}
            />
            <div className="w-60">
              <BrandSelector
                availableBrands={availableBrands}
                selectedBrandIds={selectedBrandIds}
                onSelectionChange={onBrandSelectionChange}
              />
            </div>
            <Button
              color="secondary"
              size="sm"
              iconLeading={Settings02}
              href={RouteHelper.Project.Settings.getCompetitors(projectId)}
            >
              Settings
            </Button>
            {sourcesData.totalItems > 0 && <ExportActionsButton onExportCsvAction={onExportCsv} />}
            <FilterToggle
              isExpanded={isFiltersExpanded}
              onToggle={() => setIsFiltersExpanded((prev) => !prev)}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {sourcesData.totalItems > 0 && (
            <div className="flex flex-col items-end gap-1">
              <Badge type="pill-color" size="sm" color="brand">
                {sourcesData.totalItems} sources
              </Badge>
              <ChatbotCoverageCaption enabledChatbotIds={enabledChatbotIds} />
            </div>
          )}
        </div>

        <FilterBar isExpanded={isFiltersExpanded} hasActiveFilters={hasActiveFilters} onClearAll={onClearAllFilters}>
          <TextFilter
            label="Title"
            value={titleFilter}
            onChange={onTitleChange}
            placeholder="Filter by title..."
          />
          <MultiSelectFilter
            label="Category"
            options={DOMAIN_CATEGORIES.map((c) => ({ id: c, label: c, count: categoryCounts[c] }))}
            selectedIds={domainCategoryFilter}
            onChange={onDomainCategoryChange}
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
            label="Chatbot"
            options={chatbotOptions}
            selectedIds={chatbotFilterValues}
            onChange={onChatbotChange}
          />
        </FilterBar>
      </div>

      <BrandsSourcesTable
        projectId={projectId}
        sourcesData={sourcesData}
        startDate={startDate}
        endDate={endDate}
        onPageChange={onPageChange}
        sortDescriptor={sortDescriptor}
        onSortChange={onSortChange}
      />
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
