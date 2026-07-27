import { Globe01 } from '@untitledui/icons';
import { TableCard } from '@/components/application/table/table';
import {
  OverviewTableFooter,
  TopSourceTableHeaderTrailingContent,
} from './TopSourceTableHeaderTrailingContent';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { SourcesType } from '@/app/(private)/project/[projectId]/sources/components/types';
import { SourceContentsTable } from '../../../sources/components/SourcesTable';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { ProjectRow } from '@/libs/database/Projects/types';
import { RouteHelper } from '@/libs/routes';

export const TopSourceContentsTable = ({
  project,
  competitors,
  totalCount,
  sources,
  startDate,
  endDate,
  onSourceTypeChange,
}: {
  project: ProjectRow;
  competitors: CompetitorRow[];
  totalCount: number;
  sources: SourceContent[];
  startDate: string;
  endDate: string;
  onSourceTypeChange: (sourceType: SourcesType) => void;
}) => (
  <SourceContentsTable
    project={project}
    competitors={competitors}
    sources={sources}
    startDate={startDate}
    endDate={endDate}
    hideSorting
    tableHeader={
      <TableCard.Header
        icon={Globe01}
        title="Top Source Contents"
        titleHref={RouteHelper.Project.getSourcesContents(project.id, startDate, endDate)}
        tooltip="Top source contents used in the prompts answers"
        contentTrailing={
          <TopSourceTableHeaderTrailingContent
            sourceType="contents"
            onSourceTypeChange={onSourceTypeChange}
            badgeText={`${totalCount} sources`}
          />
        }
      />
    }
    tableFooter={
      <OverviewTableFooter
        href={RouteHelper.Project.getSourcesContents(project.id, startDate, endDate)}
      />
    }
  />
);
