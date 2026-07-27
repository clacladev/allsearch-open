import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import { getPostHogServer, searchParamsToObject } from '@/libs/posthog';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getPromptRowWithId } from '@/libs/database/Prompts/queries';
import { getPromptResponseRowsWithProjectIdInDateRange } from '@/libs/database/PromptResponses/queries';
import { getSourceRowsWithProjectIdInDateRange } from '@/libs/database/Sources/queries';
import { getPromptResponsesWorkRows } from '@/libs/utils/project-analysis/helpers';
import { getOpportunitiesSummary } from '@/libs/utils/project-analysis/getOpportunitiesSummary';
import { getInspirationSourcesForPromptId } from '@/libs/utils/project-analysis/promptInspirationSources';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';
import { OUTLINE_OPPORTUNITY_TYPES } from '@/libs/utils/project-analysis/types';
import {
  filterEligibleSources,
  findOpportunity,
  normalizeOpportunityForGeneration,
  type ResolvedOpportunity,
} from '@/libs/utils/project-analysis/opportunityResolver';
import { insertPromptArticleRow } from '@/libs/database/PromptArticles/queries';
import {
  generateOutline,
  OUTLINE_MODEL_ID,
  OutlineGenerationInput,
} from '@/libs/ai/promptArticles/generateOutline';
import { PromptArticleError, errorCodeToStatus } from '@/libs/ai/promptArticles/errors';
import {
  articleSettingsSchema,
  ARTICLE_SETTINGS_DEFAULTS,
  toPersistedOutline,
} from '@/libs/ai/promptArticles/schema';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const BodySchema = z.object({
  opportunityType: z.enum(OUTLINE_OPPORTUNITY_TYPES),
  opportunityId: z.string().optional(),
  targetSourceCleanUrl: z.string().nullable().optional(),
  startDate: z.string().regex(ISO_DATE_REGEX).optional(),
  endDate: z.string().regex(ISO_DATE_REGEX).optional(),
  // Settings ride along with the outline POST so the row is created with the
  // user's choices already applied. Optional: callers without settings (e.g.
  // legacy/test paths) get sensible defaults.
  settings: articleSettingsSchema.optional(),
});


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; promptId: string }> }
) {
  try {
    const { projectId, promptId } = await params;
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    if (!promptId) return NextResponse.json({ error: 'Missing promptId' }, { status: 400 });

    const body = BodySchema.parse(await req.json());
    const targetSourceCleanUrl = body.targetSourceCleanUrl ?? null;

    const user = await getUserOrThrow();

    const [projectRow, promptRow] = await Promise.all([
      getProjectRowWithId(projectId, user.id),
      getPromptRowWithId(promptId),
    ]);
    if (!projectRow) {
      throw new PromptArticleError('UNAUTHORIZED', 'Project not found or unauthorized.');
    }
    if (!promptRow || promptRow.project_id !== projectId) {
      throw new PromptArticleError('PROMPT_NOT_FOUND', 'This prompt no longer exists.');
    }

    // Compute opportunities for the given date range.
    const defaultDateRange = getDefaultAnalysisDateRange();
    const startDateISO = body.startDate
      ? getISODateString(body.startDate)
      : defaultDateRange.startDateISO;
    const endDateISO = body.endDate
      ? getISODateString(body.endDate)
      : defaultDateRange.endDateISO;

    const [promptResponses, sourceRows] = await Promise.all([
      getPromptResponseRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
      getSourceRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
    ]);
    if (!promptResponses.length) {
      throw new PromptArticleError(
        'NOT_ENOUGH_SOURCES',
        'Not enough source data yet for this date range.'
      );
    }

    const promptResponsesWorkRows = getPromptResponsesWorkRows(promptResponses, sourceRows);
    const summary = await getOpportunitiesSummary(projectRow, promptResponsesWorkRows);
    const opportunity = findOpportunity(
      summary.data,
      promptId,
      body.opportunityType,
      targetSourceCleanUrl
    );

    let normalized: ResolvedOpportunity | null = null;
    if (opportunity) {
      normalized = normalizeOpportunityForGeneration(opportunity, promptId);
    } else if (
      body.opportunityType === 'ProjectSourceNotFoundOpportunity' &&
      targetSourceCleanUrl === null
    ) {
      // Fallback: any prompt can drive a Create-content generation, even when
      // the opportunity listing skips it (e.g. because the project is already
      // cited for this prompt). Mirrors the page-level default and lets the
      // prompt-page CTA work universally.
      normalized = {
        ourSource: undefined,
        sourcesToInspireFrom: getInspirationSourcesForPromptId(
          promptId,
          promptResponsesWorkRows
        ),
      };
    }

    if (!normalized) {
      throw new PromptArticleError(
        'OPPORTUNITY_NOT_FOUND',
        'The opportunity this prompt article was requested for no longer exists for the given date range.'
      );
    }
    const eligibleSources = filterEligibleSources(normalized.sourcesToInspireFrom);
    if (eligibleSources.length === 0) {
      throw new PromptArticleError(
        'NOT_ENOUGH_SOURCES',
        'None of the cited sources have readable page headings yet. Try back after the next analysis run.'
      );
    }

    const settings = body.settings ?? ARTICLE_SETTINGS_DEFAULTS;
    const styleGuideForPersist = settings.styleGuide.trim().length
      ? settings.styleGuide
      : null;

    const generationInput: OutlineGenerationInput = {
      projectName: projectRow.name,
      projectDomain: projectRow.hostname,
      promptName: promptRow.name,
      mode: normalized.ourSource ? 'improve-existing' : 'create-new',
      ourSource: normalized.ourSource,
      sourcesToInspireFrom: eligibleSources,
      settings: {
        targetWordCount: settings.targetWordCount,
        styleGuide: styleGuideForPersist,
        pagesToLink: settings.pagesToLink,
        targetKeywords: settings.targetKeywords,
      },
    };

    const startedAt = Date.now();
    const generation = await generateOutline(generationInput, {
      userId: user.id,
      userEmail: user.email,
      others: { projectId, promptId, opportunityType: body.opportunityType },
    });
    const durationMs = Date.now() - startedAt;

    const persisted = toPersistedOutline(generation);

    const inserted = await insertPromptArticleRow({
      project_id: projectId,
      organization_id: projectRow.organization_id,
      author_id: user.id,
      prompt_id: promptId,
      opportunity_id: body.opportunityId ?? null,
      opportunity_type: body.opportunityType,
      target_source_clean_url: targetSourceCleanUrl,
      outline: persisted,
      user_edited_outline: null,
      article_markdown: null,
      user_edited_article_markdown: null,
      sources_used: null,
      outline_used: null,
      article_model_id: null,
      outline_model_id: OUTLINE_MODEL_ID,
      target_word_count: settings.targetWordCount,
      style_guide: styleGuideForPersist,
      pages_to_link: settings.pagesToLink,
      target_keywords: settings.targetKeywords,
    });

    // Emit analytics event; flush before returning so the event isn't lost in
    // short-lived serverless invocations.
    const posthog = getPostHogServer();
    posthog.capture({
      distinctId: user.id,
      event: 'prompt_article_outline_generated',
      properties: {
        project_id: projectId,
        organization_id: projectRow.organization_id,
        prompt_id: promptId,
        opportunity_id: body.opportunityId ?? null,
        opportunity_type: body.opportunityType,
        target_source_clean_url: targetSourceCleanUrl,
        prompt_article_id: inserted.id,
        headings_count: persisted.headings.length,
        duration_ms: durationMs,
        model_id: OUTLINE_MODEL_ID,
      },
    });
    await posthog.flush();

    return NextResponse.json({
      promptArticle: inserted,
    });
  } catch (error) {
    if (error instanceof PromptArticleError) {
      const status = errorCodeToStatus(error.code);
      if (status >= 500) {
        console.error(error);
        getPostHogServer().captureException(
          error,
          await getUserId(),
          searchParamsToObject(req.nextUrl.searchParams)
        );
      }
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'INVALID_BODY' },
        { status: 400 }
      );
    }

    console.error(error);
    getPostHogServer().captureException(
      error,
      await getUserId(),
      searchParamsToObject(req.nextUrl.searchParams)
    );
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
