import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Edit05 } from '@untitledui/icons';
import z from 'zod';
import Header from '@/app/(private)/components/Header';
import { MainContainer } from '@/app/(private)/components/Containers';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getPromptRowWithId } from '@/libs/database/Prompts/queries';
import { getPromptResponseRowsWithProjectIdInDateRange } from '@/libs/database/PromptResponses/queries';
import { getSourceRowsWithProjectIdInDateRange } from '@/libs/database/Sources/queries';
import { getPromptResponsesWorkRows } from '@/libs/utils/project-analysis/helpers';
import { getOpportunitiesSummary } from '@/libs/utils/project-analysis/getOpportunitiesSummary';
import {
  filterEligibleSources,
  normalizeOpportunityForGeneration,
} from '@/libs/utils/project-analysis/opportunityResolver';
import { getInspirationSourcesForPromptId } from '@/libs/utils/project-analysis/promptInspirationSources';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';
import type { Opportunity, OutlineOpportunityType } from '@/libs/utils/project-analysis/types';
import { getPromptArticleRowWithId } from '@/libs/database/PromptArticles/queries';
import type { ArticleSourcesUsed, PromptArticleRow } from '@/libs/database/PromptArticles/types';
import { RouteHelper } from '@/libs/routes';
import { NewArticleOutline } from './components/NewArticleOutline';
import { ArticleView } from './components/ArticleView';

type Props = {
  params: Promise<{ projectId: string; promptId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { promptId } = await params;
  return {
    title: `New article | Prompt ${promptId}`,
  };
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const SearchParamsSchema = z.object({
  /**
   * Identifier of the opportunity that originated this generation flow.
   * Optional: when absent we default to a Create-content context for the
   * prompt so the user can generate an article from any prompt page.
   */
  opportunityId: z.string().optional(),
  /**
   * When set, load this exact prompt-article row instead of creating a new
   * one. The "Generate outline" CTAs always omit this so each click starts a
   * fresh outline; the "Previously generated articles" list passes the row id
   * so the user can re-open prior outlines individually.
   */
  promptArticleId: z.string().uuid().optional(),
  startDate: z.string().regex(ISO_DATE_REGEX).optional(),
  endDate: z.string().regex(ISO_DATE_REGEX).optional(),
  /**
   * `?view=outline` overrides the default branching: even when an article
   * already exists for the outline, render the outline editor instead of the
   * article view. Lets the user get back to editing the outline after
   * generating, and powers the "Back to outline" action on the article view.
   */
  view: z.enum(['outline']).optional(),
  /**
   * `?generate=1` is set by the outline editor's Generate Article button. It
   * forces the article view to mount in pre-streaming state and immediately
   * start the stream on mount, bypassing the cache-on-read for fresh
   * generation. Used so the outline editor can hand off cleanly to the article
   * surface without holding both UIs in the same component.
   */
  generate: z.enum(['1']).optional(),
});

type OutlineOpportunityContext = {
  type: OutlineOpportunityType;
  targetSourceCleanUrl: string | null;
  /**
   * Snapshot of the sources whose heading structure will inspire the outline.
   * Same shape as `PromptArticleRow.sources_used` so the outline view can
   * render them through the existing CitationsPanel for visual parity with the
   * article view.
   */
  inspirationSources: ArticleSourcesUsed;
};

/**
 * Resolve the article-outline context for the three CTA-eligible opportunity
 * types. Returns null for unsupported types (e.g. NotConsistentlyFound, Ugc)
 * so the page can render an "opportunity not eligible" state.
 */
function getOutlineOpportunityContext(
  opportunity: Opportunity,
  promptId: string
): OutlineOpportunityContext | null {
  const normalized = normalizeOpportunityForGeneration(opportunity, promptId);
  if (!normalized) return null;

  const eligibleSources = filterEligibleSources(normalized.sourcesToInspireFrom);
  const targetSourceCleanUrl =
    opportunity.type === 'ProjectSourceNotCitedOpportunity' ||
    opportunity.type === 'ProjectSourceNeedsImprovementOpportunity'
      ? opportunity.projectSource?.cleanUrl ?? null
      : null;

  return {
    type: opportunity.type as OutlineOpportunityType,
    targetSourceCleanUrl,
    inspirationSources: {
      sources: eligibleSources.map((source) => ({
        title: source.title ?? source.cleanUrl,
        cleanUrl: source.cleanUrl,
        description: source.description,
      })),
    },
  };
}

export default async function NewArticlePage({ params, searchParams }: Props) {
  const { projectId, promptId } = await params;
  const { opportunityId, promptArticleId, startDate, endDate, view, generate } =
    SearchParamsSchema.parse(await searchParams);

  const [projectRow, promptRow] = await Promise.all([
    getProjectRowWithId(projectId),
    getPromptRowWithId(promptId),
  ]);
  if (!projectRow) notFound();
  if (!promptRow || promptRow.project_id !== projectId) notFound();

  const defaultDateRange = getDefaultAnalysisDateRange();
  const startDateISO = startDate ? getISODateString(startDate) : defaultDateRange.startDateISO;
  const endDateISO = endDate ? getISODateString(endDate) : defaultDateRange.endDateISO;

  const [promptResponses, sourceRows] = await Promise.all([
    getPromptResponseRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
    getSourceRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
  ]);

  const promptResponsesWorkRows = getPromptResponsesWorkRows(promptResponses, sourceRows);

  // When ?promptArticleId is set, load that exact row. The row is the source
  // of truth for opportunity_type and target_source_clean_url; we still
  // derive inspiration sources from current data so Regenerate has an accurate
  // working set. When unset, we fall through to create-new mode and let the
  // client auto-fire a POST that always inserts a fresh row.
  let initialOutline: PromptArticleRow | null = null;
  if (promptArticleId) {
    const row = await getPromptArticleRowWithId(promptArticleId);
    if (!row || row.project_id !== projectId || row.prompt_id !== promptId) {
      notFound();
    }
    initialOutline = row;
  }

  // Resolve the outline context. When loading by id, prefer the row's own
  // opportunity_type / target_source_clean_url. Otherwise look up the
  // opportunity in the computed summary; without one (or when the opportunity
  // is no longer in the current date range) we fall back to a Create-content
  // context built from the prompt's responses, so any prompt page can drive a
  // generation flow.
  let outlineContext: OutlineOpportunityContext | null = null;
  if (!initialOutline && opportunityId && promptResponses.length) {
    const summary = await getOpportunitiesSummary(projectRow, promptResponsesWorkRows);
    const opportunity = summary.data.find((o) => o.id === opportunityId);
    outlineContext = opportunity ? getOutlineOpportunityContext(opportunity, promptId) : null;
  }
  if (!outlineContext) {
    const eligibleSources = filterEligibleSources(
      getInspirationSourcesForPromptId(promptId, promptResponsesWorkRows)
    );
    const inspirationSources: ArticleSourcesUsed = {
      sources: eligibleSources.map((source) => ({
        title: source.title ?? source.cleanUrl,
        cleanUrl: source.cleanUrl,
        description: source.description,
      })),
    };
    outlineContext = initialOutline
      ? {
          type: initialOutline.opportunity_type as OutlineOpportunityType,
          targetSourceCleanUrl: initialOutline.target_source_clean_url,
          inspirationSources,
        }
      : {
          type: 'ProjectSourceNotFoundOpportunity',
          targetSourceCleanUrl: null,
          inspirationSources,
        };
  }

  // Branch decision (in priority order):
  //   1. ?view=outline forces outline editor regardless of article state.
  //   2. ?generate=1 with an outline row → article view auto-starts streaming.
  //   3. If the outline row already has an article_markdown → article view (cached).
  //   4. Otherwise render the outline editor.
  // The article view's `Back to outline` action navigates to ?view=outline.
  const wantsArticleView = view !== 'outline' && initialOutline != null;
  const autoStartStreaming = wantsArticleView && generate === '1';
  const showArticleView =
    wantsArticleView && (autoStartStreaming || initialOutline?.article_markdown != null);

  // The article view's "Back to outline" link reuses this page's URL with
  // ?view=outline so the server-side branch above renders the outline editor
  // instead of the article view, even though the row has an article_markdown.
  // Carry the resolved promptArticleId so "Back to outline" returns to the
  // same row rather than collapsing into create-new mode.
  const baseHref = RouteHelper.Project.getPromptNewArticle(
    projectId,
    promptId,
    opportunityId,
    initialOutline?.id ?? promptArticleId,
    startDate,
    endDate
  );
  const backToOutlineHref = baseHref.includes('?')
    ? `${baseHref}&view=outline`
    : `${baseHref}?view=outline`;

  // When this page was reached from an opportunity, "Back" returns to that
  // opportunity. Without one, it returns to the prompt page that surfaced the
  // CTA.
  const backHref = opportunityId
    ? RouteHelper.Project.getOpportunityDetails(projectId, opportunityId, startDate, endDate)
    : RouteHelper.Project.getPromptDetails(projectId, promptId, startDate, endDate);
  const backLabel = opportunityId ? 'Back to opportunity' : 'Back to prompt';

  return (
    <MainContainer>
      <Header
        text="New article"
        icon={Edit05}
        description="Create an article outline to improve your brand visibility for this prompt."
        startDate={startDate}
        endDate={endDate}
      />
      {showArticleView && initialOutline ? (
        <ArticleView
          projectId={projectId}
          promptId={promptId}
          outlineId={initialOutline.id}
          promptName={promptRow.name}
          opportunityType={outlineContext.type}
          startDate={startDate}
          endDate={endDate}
          initialOutlineRow={initialOutline}
          autoStartStreaming={autoStartStreaming}
          inspirationSourceCount={outlineContext.inspirationSources.sources.length}
          backToOutlineHref={backToOutlineHref}
        />
      ) : (
        <NewArticleOutline
          projectId={projectId}
          projectDomain={projectRow.hostname}
          promptId={promptId}
          opportunityId={opportunityId}
          opportunityType={outlineContext.type}
          targetSourceCleanUrl={outlineContext.targetSourceCleanUrl}
          promptName={promptRow.name}
          startDate={startDate}
          endDate={endDate}
          inspirationSources={outlineContext.inspirationSources}
          initialOutline={initialOutline}
          backHref={backHref}
          backLabel={backLabel}
        />
      )}
    </MainContainer>
  );
}
