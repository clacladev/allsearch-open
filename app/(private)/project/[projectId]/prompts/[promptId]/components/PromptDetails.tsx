'use client';

import { useState } from 'react';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { EmptyState } from '@/app/(private)/components/EmptyState';
import dayjs from 'dayjs';
import { PromptResponsePreviewCard } from '../../../components/PromptResponsePreviewCard';
import { PromptRow } from '@/libs/database/Prompts/types';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import type { PromptArticleRow } from '@/libs/database/PromptArticles/types';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { PaginatedResult } from '@/libs/utils/PaginatedResult';
import { SourceContentsTable } from '../../../sources/components/SourcesTable';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { useRouter } from 'next/navigation';
import { RouteHelper } from '@/libs/routes';
import { StandardTableHeader } from '@/app/(private)/components/StandardTable/StandardTableHeader';
import { Badge } from '@/components/ui/badge';
import { PromptResponseDetailModal } from './PromptResponseDetailModal';
import { PromptResponseContent } from '../types';
import { CreateArticleOutlineCTA } from '../../../components/articles/CreateArticleOutlineCTA';
import { PreviouslyGeneratedArticlesSection } from '../../../components/articles/PreviouslyGeneratedArticlesSection';

dayjs.extend(LocalizedFormat);
dayjs.extend(relativeTime);

export default function PromptDetails({
  projectId,
  promptId,
  sourceData,
  promptResponsesContents,
  previouslyGeneratedArticles,
  startDate,
  endDate,
}: {
  projectId: string;
  promptId: string;
  sourceData: PaginatedResult<SourceContent>;
  promptResponsesContents: PromptResponseContent[];
  previouslyGeneratedArticles: PromptArticleRow[];
  startDate?: string;
  endDate?: string;
}) {
  const router = useRouter();
  const { currentProject, currentCompetitors, allCurrentPrompts } = usePrivateLayoutContext();
  const [selectedResponse, setSelectedResponse] = useState<PromptResponseContent | undefined>();
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

  const onSourcesPageChange = (value: number) =>
    router.push(
      RouteHelper.Project.getPromptDetails(projectId, promptId, startDate, endDate, value - 1)
    );

  if (!currentProject) return null;

  const prompt = allCurrentPrompts.find((prompt) => prompt.id === promptId);
  const lastPromptResponse = promptResponsesContents[0];

  return (
    <div className="flex flex-col gap-4">
      {!!prompt && !prompt.is_archived ? (
        <div className="flex flex-col gap-8">
          <PromptHeader prompt={prompt} lastUpdatedAt={lastPromptResponse?.createdAt} />
          <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

          <div className="flex max-w-180 flex-col gap-8">
            <CreateArticleOutlineCTA
              projectId={projectId}
              promptId={promptId}
              startDate={startDate}
              endDate={endDate}
            />

            <PreviouslyGeneratedArticlesSection
              projectId={projectId}
              articles={previouslyGeneratedArticles}
              prompts={[prompt]}
              description="Outlines and articles you've already generated for this prompt. Pick up where you left off."
              startDate={startDate}
              endDate={endDate}
            />
          </div>

          <PromptSourcesTable
            project={currentProject}
            competitors={currentCompetitors}
            sourceData={sourceData}
            startDate={startDate}
            endDate={endDate}
            onPageChange={onSourcesPageChange}
          />

          <PromptResponsesPreviews
            project={currentProject}
            competitors={currentCompetitors}
            promptResponsesContents={promptResponsesContents}
            onResponseSelect={(response) => {
              setSelectedResponse(response);
              setIsResponseModalOpen(true);
            }}
          />

          <PromptResponseDetailModal
            isOpen={isResponseModalOpen}
            setIsOpen={setIsResponseModalOpen}
            promptName={prompt.name}
            promptResponse={selectedResponse}
            project={currentProject}
            competitors={currentCompetitors}
          />
        </div>
      ) : !!prompt && prompt.is_archived ? (
        <EmptyState
          title="Prompt archived"
          description="The prompt you are looking for is archived."
          shouldShowGoBackButton
        />
      ) : (
        <EmptyState
          title="Prompt not found"
          description="The prompt you are looking for does not exist."
          shouldShowGoBackButton
        />
      )}
    </div>
  );
}

const PromptHeader = ({ prompt, lastUpdatedAt }: { prompt: PromptRow; lastUpdatedAt: string }) => (
  <div className="flex flex-col gap-1">
    <h2 className="text-primary text-lg font-semibold">{prompt.name}</h2>

    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="text-tertiary">
        {lastUpdatedAt ? `Last updated ${dayjs(lastUpdatedAt).format('ll')}` : 'No responses yet'}
      </span>
    </div>
  </div>
);

const PromptSourcesTable = ({
  project,
  competitors,
  sourceData,
  startDate,
  endDate,
  onPageChange,
}: {
  project: ProjectRow;
  competitors: CompetitorRow[];
  sourceData: PaginatedResult<SourceContent>;
  startDate?: string;
  endDate?: string;
  onPageChange: (value: number) => void;
}) => (
  <SourceContentsTable
    project={project}
    competitors={competitors}
    sources={sourceData.data}
    startDate={startDate}
    endDate={endDate}
    totalPages={sourceData.totalPages}
    tableHeader={
      <StandardTableHeader
        title="Used Sources"
        description="Sources used to generate the responses for this prompt"
        contentTrailing={<Badge>{sourceData.totalItems} sources</Badge>}
      />
    }
    tableFooter={
      <DataTablePagination
        page={sourceData.currentPage + 1}
        totalPages={sourceData.totalPages}
        onPageChange={onPageChange}
        className="px-4 py-3 md:px-6 md:py-1.5"
      />
    }
  />
);

const SectionTitle = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-md text-primary font-semibold">{title}</p>
    {description && <p className="text-tertiary text-sm">{description}</p>}
  </div>
);

const PromptResponsesPreviews = ({
  project,
  competitors,
  promptResponsesContents,
  onResponseSelect,
}: {
  project: ProjectRow;
  competitors: CompetitorRow[];
  promptResponsesContents: PromptResponseContent[];
  onResponseSelect: (response: PromptResponseContent) => void;
}) => (
  <div className="flex flex-col gap-4">
    <SectionTitle title="Responses" description="Prompt responses saved for this prompt" />

    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {!!promptResponsesContents.length ? (
        <>
          {promptResponsesContents.map((promptResponse) => (
            <PromptResponsePreviewCard
              key={promptResponse.id}
              project={project}
              competitors={competitors}
              promptResponse={promptResponse}
              onSelect={onResponseSelect}
            />
          ))}
        </>
      ) : (
        <EmptyState
          title="No responses found"
          description="No responses found for this prompt."
          shouldShowGoBackButton
        />
      )}
    </div>
  </div>
);
