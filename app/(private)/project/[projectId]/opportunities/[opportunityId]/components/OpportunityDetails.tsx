'use client';

import { useState } from 'react';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { EmptyState } from '@/app/(private)/components/EmptyState';
import {
  Opportunity,
  ProjectSourceNeedsImprovementOpportunity,
  ProjectSourceNotCitedOpportunity,
  ProjectSourceNotConsistentlyFoundOpportunity,
  ProjectSourceNotFoundOpportunity,
  UgcSourceNeedsImprovementOpportunity,
} from '@/libs/utils/project-analysis/types';
import type { SourceItem } from '@/libs/database/Sources/types';
import type { PromptArticleRow } from '@/libs/database/PromptArticles/types';
import { RecentResponsesMap, SourceIdMap } from './helpers';
import { PromptResponsePreviewCard } from '../../../components/PromptResponsePreviewCard';
import { PromptRow } from '@/libs/database/Prompts/types';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import {
  ActionBadge,
  DifficultyBadgeWithTooltip,
  PriorityScoreBadgeWithTooltip,
} from '../../components/Badges';
import { BrandsIconsStackWithTooltip } from '../../../sources/components/BrandsIconsStack';
import { Badge, BadgeWithDot } from '@/components/base/badges/badges';
import { RouteHelper } from '@/libs/routes';
import Link from 'next/link';
import { CheckCircleBroken, Heading01, LinkExternal01 } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { Tooltip } from '@/app/(private)/components/Tooltip';
import { OPPORTUNITY_TYPE_DESCRIPTION, OPPORTUNITY_TYPE_TITLE } from '@/libs/utils/opportunities';
import { SourceHeadersModal } from './SourceHeadersModal';
import { PromptResponseDetailModal } from '../../../prompts/[promptId]/components/PromptResponseDetailModal';
import { PromptResponseContent } from '../../../prompts/[promptId]/types';
import { CreateArticleOutlineCTA } from '../../../components/articles/CreateArticleOutlineCTA';
import { PreviouslyGeneratedArticlesSection } from '../../../components/articles/PreviouslyGeneratedArticlesSection';

type ImprovedContentOpportunity =
  | ProjectSourceNeedsImprovementOpportunity
  | ProjectSourceNotCitedOpportunity;

function isImproveContentOpportunity(
  opportunity: Opportunity
): opportunity is ImprovedContentOpportunity {
  return (
    opportunity.type === 'ProjectSourceNeedsImprovementOpportunity' ||
    opportunity.type === 'ProjectSourceNotCitedOpportunity'
  );
}

function isCreateContentOpportunity(
  opportunity: Opportunity
): opportunity is ProjectSourceNotFoundOpportunity {
  return opportunity.type === 'ProjectSourceNotFoundOpportunity';
}

function isNotConsistentlyFoundOpportunity(
  opportunity: Opportunity
): opportunity is ProjectSourceNotConsistentlyFoundOpportunity {
  return opportunity.type === 'ProjectSourceNotConsistentlyFoundOpportunity';
}

function isEngageOpportunity(
  opportunity: Opportunity
): opportunity is UgcSourceNeedsImprovementOpportunity {
  return opportunity.type === 'UgcSourceNeedsImprovementOpportunity';
}

function titleFromCleanUrl(cleanUrl: string): string {
  const domain = cleanUrl.split('/')[0] ?? cleanUrl;
  const name = domain.split('.')[0] ?? domain;
  if (!name) return cleanUrl;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function OpportunityDetails({
  opportunity,
  sourceIdMap,
  recentResponses = {},
  previouslyGeneratedArticles = [],
  startDate,
  endDate,
}: {
  opportunity?: Opportunity;
  sourceIdMap?: SourceIdMap;
  recentResponses?: RecentResponsesMap;
  previouslyGeneratedArticles?: PromptArticleRow[];
  startDate?: string;
  endDate?: string;
}) {
  const { currentProject, currentCompetitors, currentPrompts } = usePrivateLayoutContext();
  if (!currentProject) return null;

  return (
    <div className="flex flex-col gap-4">
      {opportunity && sourceIdMap ? (
        <div className="flex max-w-180 flex-col gap-12">
          <OpportunityHeader opportunity={opportunity} />

          {isImproveContentOpportunity(opportunity) && (
            <>
              <CreateArticleOutlineCTA
                projectId={currentProject.id}
                opportunityId={opportunity.id}
                promptId={Object.keys(opportunity.promptsBasedInspiration)[0]}
                startDate={startDate}
                endDate={endDate}
              />
              <PreviouslyGeneratedArticlesSection
                projectId={currentProject.id}
                articles={previouslyGeneratedArticles}
                prompts={currentPrompts}
                showPromptName
                description="Outlines and articles you've already generated for this opportunity. Pick up where you left off."
                startDate={startDate}
                endDate={endDate}
              />
              <TargetPromptSection
                promptIds={Object.keys(opportunity.promptsBasedInspiration)}
                prompts={currentPrompts}
                startDate={startDate}
                endDate={endDate}
              />
              {opportunity.projectSource && (
                <TargetSourceSection source={opportunity.projectSource} />
              )}

              <div className="flex flex-col gap-24">
                {Object.entries(opportunity.promptsBasedInspiration).map(
                  ([promptId, { sources }]) => (
                    <PromptInspirationGroup
                      key={promptId}
                      promptId={promptId}
                      sources={sources}
                      recentResponses={recentResponses[promptId] ?? []}
                      prompts={currentPrompts}
                      project={currentProject}
                      competitors={currentCompetitors}
                      sourceIdMap={sourceIdMap}
                      showPromptTitle={Object.keys(opportunity.promptsBasedInspiration).length > 1}
                    />
                  )
                )}
              </div>
            </>
          )}

          {isCreateContentOpportunity(opportunity) && (
            <>
              <CreateArticleOutlineCTA
                projectId={currentProject.id}
                opportunityId={opportunity.id}
                promptId={opportunity.promptId}
                startDate={startDate}
                endDate={endDate}
              />
              <PreviouslyGeneratedArticlesSection
                projectId={currentProject.id}
                articles={previouslyGeneratedArticles}
                prompts={currentPrompts}
                showPromptName
                description="Outlines and articles you've already generated for this opportunity. Pick up where you left off."
                startDate={startDate}
                endDate={endDate}
              />
              <TargetPromptSection
                promptIds={[opportunity.promptId]}
                prompts={currentPrompts}
                startDate={startDate}
                endDate={endDate}
              />
              <SourcesList
                title="Inspiration sources"
                description="Sources that appear in AI responses for this prompt. Use them as inspiration for creating your own content."
                sources={opportunity.inspirationSources}
                project={currentProject}
                competitors={currentCompetitors}
                sourceIdMap={sourceIdMap}
                startDate={startDate}
                endDate={endDate}
              />
              {Object.entries(recentResponses).map(([promptId, responses]) => (
                <RecentResponses
                  key={promptId}
                  promptId={promptId}
                  prompts={currentPrompts}
                  project={currentProject}
                  competitors={currentCompetitors}
                  recentResponses={responses}
                  startDate={startDate}
                  endDate={endDate}
                />
              ))}
            </>
          )}

          {isNotConsistentlyFoundOpportunity(opportunity) && (
            <>
              <TargetPromptSection
                promptIds={[opportunity.promptId]}
                prompts={currentPrompts}
                startDate={startDate}
                endDate={endDate}
              />
              <SourcesList
                title="Inspiration sources"
                description="Sources that appear in AI responses where your content is missing. Review and improve your content to increase consistency."
                sources={opportunity.inspirationSources}
                project={currentProject}
                competitors={currentCompetitors}
                sourceIdMap={sourceIdMap}
                startDate={startDate}
                endDate={endDate}
              />
              {Object.entries(recentResponses).map(([promptId, responses]) => (
                <RecentResponses
                  key={promptId}
                  promptId={promptId}
                  prompts={currentPrompts}
                  project={currentProject}
                  competitors={currentCompetitors}
                  recentResponses={responses}
                  startDate={startDate}
                  endDate={endDate}
                />
              ))}
            </>
          )}

          {isEngageOpportunity(opportunity) && (
            <>
              <TargetPromptSection
                promptIds={[opportunity.promptId]}
                prompts={currentPrompts}
                startDate={startDate}
                endDate={endDate}
              />
              <TargetSourceSection source={opportunity.source} />
              {Object.entries(recentResponses).map(([promptId, responses]) => (
                <RecentResponses
                  key={promptId}
                  promptId={promptId}
                  prompts={currentPrompts}
                  project={currentProject}
                  competitors={currentCompetitors}
                  recentResponses={responses}
                  startDate={startDate}
                  endDate={endDate}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <EmptyState
          title="Opportunity not found"
          description="The opportunity you are looking for does not exist."
          shouldShowGoBackButton
        />
      )}
    </div>
  );
}

const OpportunityHeader = ({ opportunity }: { opportunity: Opportunity }) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center gap-2">
      <ActionBadge opportunityType={opportunity.type} />
      <PriorityScoreBadgeWithTooltip priorityScore={opportunity.priorityScore} variation="long" />
      <DifficultyBadgeWithTooltip opportunityType={opportunity.type} variation="long" />
    </div>
    <div className="flex flex-col gap-1">
      <h2 className="text-primary text-lg font-semibold">
        {OPPORTUNITY_TYPE_TITLE[opportunity.type]}
      </h2>
      <p className="text-tertiary text-sm">{OPPORTUNITY_TYPE_DESCRIPTION[opportunity.type]}</p>
    </div>
  </div>
);

const SectionTitle = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-md text-primary font-semibold">{title}</p>
    {description && <p className="text-tertiary text-sm">{description}</p>}
  </div>
);

const TargetPromptSection = ({
  promptIds,
  prompts,
  startDate,
  endDate,
}: {
  promptIds: string[];
  prompts: PromptRow[];
  startDate?: string;
  endDate?: string;
}) => {
  const matchedPrompts = promptIds
    .map((id) => prompts.find((p) => p.id === id))
    .filter(Boolean) as PromptRow[];

  if (!matchedPrompts.length) return null;

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle title={matchedPrompts.length > 1 ? 'Target prompts' : 'Target prompt'} />
      <div className="flex flex-wrap gap-1.5">
        {matchedPrompts.map((prompt) => (
          <Link
            key={prompt.id}
            href={RouteHelper.Project.getPromptDetails(
              prompt.project_id,
              prompt.id,
              startDate,
              endDate
            )}
            className="no-underline!"
          >
            <BadgeWithDot size="lg" color="brand" type="modern">
              {prompt.name}
            </BadgeWithDot>
          </Link>
        ))}
      </div>
    </div>
  );
};

const TargetSourceSection = ({
  source,
}: {
  source: { url: string; cleanUrl: string; title?: string };
}) => (
  <div className="flex flex-col gap-4">
    <SectionTitle title="Target source" />
    <div className="border-secondary rounded-xl border px-5 py-4">
      <p className="text-primary text-sm font-medium">{source.title ?? 'No title found'}</p>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-tertiary hover:text-secondary mt-1 flex items-center gap-1 text-sm transition-colors"
      >
        {source.cleanUrl}
        <LinkExternal01 className="size-3" />
      </a>
    </div>
  </div>
);

const SourcesList = ({
  title,
  description,
  sources,
  project,
  competitors,
  sourceIdMap,
  startDate,
  endDate,
}: {
  title: string;
  description: string;
  sources: SourceItem[];
  project: ProjectRow;
  competitors: CompetitorRow[];
  sourceIdMap: SourceIdMap;
  startDate?: string;
  endDate?: string;
}) => {
  if (!sources.length) return null;

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle title={title} description={description} />

      <div className="border-secondary rounded-xl border">
        <ul className="divide-border-secondary divide-y">
          {sources.map((source) => (
            <SourceItem
              key={source.cleanUrl}
              source={source}
              project={project}
              competitors={competitors}
              sourceIdMap={sourceIdMap}
              startDate={startDate}
              endDate={endDate}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

const SourceItem = ({
  source,
  project,
  competitors,
  sourceIdMap,
  startDate,
  endDate,
}: {
  source: SourceItem & { citationCount?: number };
  project: ProjectRow;
  competitors: CompetitorRow[];
  sourceIdMap: SourceIdMap;
  startDate?: string;
  endDate?: string;
}) => {
  const [isHeadersModalOpen, setIsHeadersModalOpen] = useState(false);
  const sourceId = sourceIdMap[source.cleanUrl] ?? source.cleanUrl;

  return (
    <li className="flex h-12 items-center justify-between gap-3 px-4">
      <Link
        href={RouteHelper.Project.getSourceDetails(project.id, sourceId, startDate, endDate)}
        className="group flex min-w-0 flex-1 items-baseline gap-1.5"
      >
        <span className="text-primary group-hover:text-brand-secondary truncate text-sm font-medium transition-colors">
          {source.title ?? titleFromCleanUrl(source.cleanUrl)}
        </span>
        <span className="text-quaternary hidden truncate text-xs sm:inline">
          ·&nbsp;{source.cleanUrl}
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-3">
        {!!source.headings?.length && (
          <>
            <Button
              onClick={() => setIsHeadersModalOpen(true)}
              color="tertiary"
              size="xs"
              iconLeading={<Heading01 size={14} />}
            >
              Headers
            </Button>
            <SourceHeadersModal
              source={source}
              isOpen={isHeadersModalOpen}
              setIsOpen={setIsHeadersModalOpen}
            />
          </>
        )}

        {!!source.brandIdsRanking?.length && (
          <BrandsIconsStackWithTooltip
            brandIdsRanking={source.brandIdsRanking}
            competitors={competitors}
            project={project}
          />
        )}

        {source.isCited && <CitedIndicator count={source.citationCount} />}
      </div>
    </li>
  );
};

const CitedIndicator = ({ count }: { count?: number }) => (
  <Tooltip
    title={
      count && count > 1
        ? `This source is cited ${count} times in AI responses`
        : 'This source is cited in the AI response'
    }
  >
    <div className="flex items-center gap-1">
      <CheckCircleBroken className="text-brand-secondary" size={14} />
      <span className="text-tertiary text-xs">Cited{count && count > 1 ? ` ${count}x` : ''}</span>
    </div>
  </Tooltip>
);

const PromptInspirationGroup = ({
  promptId,
  sources,
  recentResponses,
  prompts,
  project,
  competitors,
  sourceIdMap,
  showPromptTitle,
  startDate,
  endDate,
}: {
  promptId: string;
  sources: SourceItem[];
  recentResponses: PromptResponseContent[];
  prompts: PromptRow[];
  project: ProjectRow;
  competitors: CompetitorRow[];
  sourceIdMap: SourceIdMap;
  showPromptTitle: boolean;
  startDate?: string;
  endDate?: string;
}) => {
  const prompt = prompts.find((p) => p.id === promptId);
  if (!prompt) return null;

  return (
    <div className="flex flex-col gap-8">
      {showPromptTitle && (
        <div className="flex items-center gap-3">
          <hr className="bg-border-secondary h-px flex-1 border-none" aria-hidden="true" />
          <div>
            <Badge color="gray">{prompt.name}</Badge>
          </div>
          <hr className="bg-border-secondary h-px flex-1 border-none" aria-hidden="true" />
        </div>
      )}

      <SourcesList
        title="Competing sources"
        description="Sources that have outranked your content in AI responses."
        sources={sources}
        project={project}
        competitors={competitors}
        sourceIdMap={sourceIdMap}
        startDate={startDate}
        endDate={endDate}
      />

      <RecentResponses
        promptId={promptId}
        prompts={prompts}
        project={project}
        competitors={competitors}
        recentResponses={recentResponses}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};

const RecentResponses = ({
  promptId,
  prompts,
  project,
  competitors,
  recentResponses,
  startDate,
  endDate,
}: {
  promptId: string;
  prompts: PromptRow[];
  project: ProjectRow;
  competitors: CompetitorRow[];
  recentResponses: PromptResponseContent[];
  startDate?: string;
  endDate?: string;
}) => {
  const [selectedResponse, setSelectedResponse] = useState<PromptResponseContent | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prompt = prompts.find((p) => p.id === promptId);
  if (!recentResponses.length || !prompt) return null;

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle
        title="Recent responses"
        description="Latest AI responses for the target prompt."
      />

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {recentResponses.map((response) => (
          <PromptResponsePreviewCard
            key={response.id}
            project={project}
            competitors={competitors}
            promptResponse={response}
            onSelect={(r) => {
              setSelectedResponse(r);
              setIsModalOpen(true);
            }}
          />
        ))}
      </div>

      <Link
        href={RouteHelper.Project.getPromptDetails(
          prompt.project_id,
          prompt.id,
          startDate,
          endDate
        )}
        className="text-brand-secondary hover:text-brand-secondary_hover text-sm font-semibold transition-colors"
      >
        View all responses →
      </Link>

      <PromptResponseDetailModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        promptName={prompt.name}
        promptResponse={selectedResponse}
        project={project}
        competitors={competitors}
      />
    </div>
  );
};

