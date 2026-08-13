import { Activity } from 'lucide-react';
import { StandardTableHeader } from '@/app/(private)/components/StandardTable/StandardTableHeader';
import { RouteHelper } from '@/libs/routes';
import { Opportunity } from '@/libs/utils/project-analysis/types';
import { PromptRow } from '@/libs/database/Prompts/types';
import { OpportunitiesTable } from '../../../opportunities/components/OpportunitiesTable';
import { OverviewTableFooter } from './TopSourceTableHeaderTrailingContent';

export const TopOpportunitiesTable = ({
  projectId,
  opportunities,
  totalCount,
  prompts,
  startDate,
  endDate,
}: {
  projectId: string;
  opportunities: Opportunity[];
  totalCount: number;
  prompts: PromptRow[];
  startDate?: string;
  endDate?: string;
}) => (
  <OpportunitiesTable
    opportunities={opportunities}
    prompts={prompts}
    projectId={projectId}
    startDate={startDate}
    endDate={endDate}
    hideSorting
    tableHeader={
      <StandardTableHeader
        icon={Activity}
        title="Opportunities"
        titleHref={RouteHelper.Project.getOpportunities(projectId, startDate, endDate)}
        tooltip="Opportunities to improve your brand visibility in the prompts answers"
        badgeTrailing={`${totalCount} opportunities`}
      />
    }
    tableFooter={
      <OverviewTableFooter
        href={RouteHelper.Project.getOpportunities(projectId, startDate, endDate)}
      />
    }
  />
);
