import { SourceDomain } from '@/libs/utils/project-analysis/getSourceDomainsSummary';
import { SourcesType } from '@/app/(private)/project/[projectId]/sources/components/types';
import { SourceDomainsTable } from '../../../sources/components/SourcesTable';
import { Globe } from 'lucide-react';
import {
  OverviewTableFooter,
  TopSourceTableHeaderTrailingContent,
} from './TopSourceTableHeaderTrailingContent';
import { StandardTableHeader } from '@/app/(private)/components/StandardTable/StandardTableHeader';
import { RouteHelper } from '@/libs/routes';

export const TopSourceDomainsTable = ({
  projectId,
  totalCount,
  sources,
  startDate,
  endDate,
  onSourceTypeChange,
}: {
  projectId: string;
  totalCount: number;
  sources: SourceDomain[];
  startDate: string;
  endDate: string;
  onSourceTypeChange: (sourceType: SourcesType) => void;
}) => (
  <SourceDomainsTable
    sources={sources}
    hideSorting
    tableHeader={
      <StandardTableHeader
        icon={Globe}
        title="Top Source Domains"
        titleHref={RouteHelper.Project.getSourcesDomains(projectId, startDate, endDate)}
        tooltip="Top source domains used in the prompts answers"
        contentTrailing={
          <TopSourceTableHeaderTrailingContent
            sourceType="domains"
            onSourceTypeChange={onSourceTypeChange}
            badgeText={`${totalCount} sources`}
          />
        }
      />
    }
    tableFooter={
      <OverviewTableFooter
        href={RouteHelper.Project.getSourcesDomains(projectId, startDate, endDate)}
      />
    }
  />
);
