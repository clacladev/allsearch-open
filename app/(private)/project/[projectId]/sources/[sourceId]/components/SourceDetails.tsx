'use client';

import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { EmptyState } from '@/app/(private)/components/EmptyState';
import { CheckCircle2, CircleAlert, ExternalLink } from 'lucide-react';
import { CopyButton } from '@/app/(private)/components/CopyButton';
import SmallProgressBar from '../../components/SmallProgressBar';
import { SourceStatisticBox } from './SourceStatisticBox';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { BrandsIconsStack, getBrandNamesList } from '../../components/BrandsIconsStack';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import { PromptRow } from '@/libs/database/Prompts/types';
import Link from 'next/link';
import { RouteHelper } from '@/libs/routes';
import { toOrdinal } from '@/libs/numberFormatters';
import { Tooltip } from '@/app/(private)/components/Tooltip';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { SourceHeadingsList } from '../../components/SourceHeadingsList';

dayjs.extend(LocalizedFormat);

export default function SourceDetails({
  source,
  startDate,
  endDate,
}: {
  source?: SourceContent;
  startDate?: string;
  endDate?: string;
}) {
  const { currentProject, currentCompetitors, currentPrompts } = usePrivateLayoutContext();
  if (!currentProject) return null;

  return (
    <div className="flex flex-col gap-4">
      {source ? (
        <div className="flex max-w-180 flex-col gap-8">
          <SourceHeader source={source} />
          <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />
          <SourceStatistics
            project={currentProject}
            competitors={currentCompetitors}
            source={source}
          />
          <SourceRelatedPrompts
            source={source}
            prompts={currentPrompts}
            startDate={startDate}
            endDate={endDate}
          />
          <SourceDescription source={source} />
          <SourceHeadersStructure source={source} />
        </div>
      ) : (
        <EmptyState
          title="Source not found"
          description="The source you are looking for does not exist."
          shouldShowGoBackButton
        />
      )}
    </div>
  );
}

const SourceHeader = ({ source }: { source: SourceContent }) => (
  <div className="flex flex-col gap-1">
    <h2 className="text-primary text-lg font-semibold">{source.title ?? `No title found`}</h2>

    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-tertiary hover:text-secondary flex items-center gap-1 transition-colors"
      >
        {source.cleanUrl}
        <ExternalLink className="size-3" />
      </a>
      <span className="text-quaternary">·</span>
      <span className="text-tertiary">Last updated {dayjs(source.createdAt).format('ll')}</span>
    </div>
  </div>
);

const SectionTitle = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-md text-primary font-semibold">{title}</p>
    {description && <p className="text-tertiary text-sm">{description}</p>}
  </div>
);

const SourceStatistics = ({
  project,
  competitors,
  source,
}: {
  project: ProjectRow;
  competitors: CompetitorRow[];
  source: SourceContent;
}) => (
  <div className="flex flex-col gap-4">
    <SectionTitle
      title="Statistics"
      description="Key metrics for this source across your tracked prompts."
    />
    <div className="flex flex-wrap gap-3">
      <SourceStatisticBox
        title={
          <>
            <span>Category</span>
            <CircleAlert size={14} />
          </>
        }
        value={
          <Badge variant="secondary">{source.domainCategory}</Badge>
        }
        tooltipTitle="Category of the source"
        tooltipDescription={source.domainCategory}
      />

      <SourceStatisticBox
        title={
          <>
            <span>Used %</span>
            <CircleAlert size={14} />
          </>
        }
        value={
          <>
            <span>{source.usedPercentage}%</span>
            <SmallProgressBar value={source.usedPercentage} className="w-full" />
          </>
        }
        tooltipTitle={`Used ${source.usedPercentage}% of the times`}
        tooltipDescription={`Total of ${source.usedCount} times`}
      />

      <SourceStatisticBox
        title={
          <>
            <span>Cited %</span>
            <CircleAlert size={14} />
          </>
        }
        value={
          <>
            <span>{source.citedPercentage}%</span>
            <SmallProgressBar value={source.citedPercentage} className="w-full" />
          </>
        }
        tooltipTitle={`Cited ${source.citedPercentage}% of the times`}
        tooltipDescription={`Total of ${source.citedCount} times`}
      />

      <SourceStatisticBox
        title={
          <>
            <span>Mention</span>
            <CircleAlert size={14} />
          </>
        }
        value={
          source.projectIdRank !== -1 ? (
            <>
              <CheckCircle2 className="text-primary" size={20} />
              <span>{toOrdinal(source.projectIdRank + 1)}</span>
            </>
          ) : (
            'No'
          )
        }
        tooltipTitle="Mention"
        tooltipDescription="Is your brand mentioned in this content?"
      />

      <SourceStatisticBox
        title={
          <>
            <span>Brands</span>
            <CircleAlert size={14} />
          </>
        }
        value={
          !!source.brandIdsRanking.length ? (
            <BrandsIconsStack
              brandIdsRanking={source.brandIdsRanking}
              competitors={competitors}
              project={project}
            />
          ) : (
            'None'
          )
        }
        tooltipTitle="Brands mentions in order of appearance"
        tooltipDescription={
          !!source.brandIdsRanking.length
            ? getBrandNamesList(source.brandIdsRanking, competitors, project)
            : 'No brands mentioned'
        }
      />
    </div>
  </div>
);

const PromptBadge = ({ text, href, isCited }: { text: string; href: string; isCited: boolean }) => (
  <Link href={href} className="no-underline!">
    <Badge variant={isCited ? 'default' : 'secondary'}>
      {text}{' '}
      {isCited && (
        <>
          <CheckCircle2 className="text-primary-foreground" size={10} />
          <span className="text-primary-foreground">
            <Tooltip title="This source has been cited in this prompt responses">Cited</Tooltip>
          </span>
        </>
      )}
    </Badge>
  </Link>
);

const SourceRelatedPrompts = ({
  source,
  prompts,
  startDate,
  endDate,
}: {
  source: SourceContent;
  prompts: PromptRow[];
  startDate?: string;
  endDate?: string;
}) => (
  <div className="flex flex-col gap-4">
    <SectionTitle
      title="Used in prompts"
      description={
        source.usedInPromptIds.length
          ? 'Prompts where this source appeared in AI responses.'
          : 'This source is not used in any prompt.'
      }
    />
    {!!source.usedInPromptIds.length && (
      <div className="flex flex-wrap gap-2">
        {source.usedInPromptIds
          .map((promptId) => prompts.find((prompt) => prompt.id === promptId))
          .filter((prompt) => !!prompt)
          .map((prompt) => (
            <PromptBadge
              key={prompt.id}
              text={prompt.name}
              href={RouteHelper.Project.getPromptDetails(
                prompt.project_id,
                prompt.id,
                startDate,
                endDate
              )}
              isCited={source.citedInPromptIds.includes(prompt.id)}
            />
          ))}
      </div>
    )}
  </div>
);

const SourceDescription = ({ source }: { source: SourceContent }) => (
  <div className="flex flex-col gap-4">
    <SectionTitle
      title="Description"
      description={source.description ? '' : 'No description found.'}
    />
    {!!source.description && (
      <div className="border-secondary bg-secondary rounded-xl border p-4">
        <p className="text-secondary text-sm leading-relaxed">{source.description}</p>
      </div>
    )}
  </div>
);

const headingsToMarkdown = (headings: SourceContent['headings']) =>
  headings?.map((h) => `${h.tag.toUpperCase()}: ${h.text}`).join('\n') ?? '';

const SourceHeadersStructure = ({ source }: { source: SourceContent }) => {
  const hasHeadings = !!source.headings?.length;

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle
        title="Headers structure"
        description={hasHeadings ? 'The heading hierarchy of this page.' : 'No headings found.'}
      />
      {hasHeadings && (
        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <CopyButton text={headingsToMarkdown(source.headings)} />
          </div>
          <SourceHeadingsList headings={source.headings ?? []} />
        </div>
      )}
    </div>
  );
};
