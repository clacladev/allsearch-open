import { SourceDomain } from '@/libs/utils/project-analysis/getSourceDomainsSummary';
import { SourcesType } from '@/app/(private)/project/[projectId]/sources/components/types';
import { SourceDomainsTable } from '../../../sources/components/SourcesTable';
import { Globe01 } from '@untitledui/icons';
import {
  OverviewTableFooter,
  TopSourceTableHeaderTrailingContent,
} from './TopSourceTableHeaderTrailingContent';
import { TableCard } from '@/components/application/table/table';
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
      <TableCard.Header
        icon={Globe01}
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
