import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import {
  getPromptArticleRowWithId,
  setArticleGeneratedFromStream,
  updatePromptArticleUserEditedMarkdown,
} from '@/libs/database/PromptArticles/queries';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getPromptRowWithId } from '@/libs/database/Prompts/queries';
import { getPromptResponseRowsWithProjectIdInDateRange } from '@/libs/database/PromptResponses/queries';
import { getSourceRowsWithProjectIdInDateRange } from '@/libs/database/Sources/queries';
import { getPromptResponsesWorkRows } from '@/libs/utils/project-analysis/helpers';
import { getOpportunitiesSummary } from '@/libs/utils/project-analysis/getOpportunitiesSummary';
import { getInspirationSourcesForPromptId } from '@/libs/utils/project-analysis/promptInspirationSources';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import {
  filterEligibleSources,
  findOpportunity,
  normalizeOpportunityForGeneration,
  type ResolvedOpportunity,
} from '@/libs/utils/project-analysis/opportunityResolver';
import {
  OUTLINE_OPPORTUNITY_TYPES,
  type OutlineOpportunityType,
} from '@/libs/utils/project-analysis/types';
import {
  ARTICLE_MODEL_ID,
  startArticleStream,
  type ArticleSourceForPrompt,
} from '@/libs/ai/promptArticles/streamArticle';
import { PromptArticleError, errorCodeToStatus } from '@/libs/ai/promptArticles/errors';
import type {
  ArticleSourcesUsed,
  PromptArticleRow,
} from '@/libs/database/PromptArticles/types';

// Soft cap to prevent DB bloat / DOS via huge payloads. ~50k chars ≈ ~7,500 words.
const USER_EDITED_ARTICLE_MAX_CHARS = 50_000;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const PostBodySchema = z.object({
  forceRegenerate: z.boolean().optional(),
  // Same date range the outline view was rendered with. Without these the
  // article route falls back to the project's default analysis window, which
  // can be empty (no recent prompt responses) and trigger a spurious
  // NOT_ENOUGH_SOURCES even though the outline was generated against an older
  // window that did have data. Mirrors the outline POST route's body shape.
  startDate: z.string().regex(ISO_DATE_REGEX).optional(),
  endDate: z.string().regex(ISO_DATE_REGEX).optional(),
});

const PatchBodySchema = z.object({
  userEditedArticleMarkdown: z
    .string()
    .max(USER_EDITED_ARTICLE_MAX_CHARS)
    .nullable(),
});

type RouteParams = { projectId: string; promptId: string; promptArticleId: string };

type OwnershipResult =
  | { ok: true; row: PromptArticleRow }
  | { ok: false; response: NextResponse };

/**
 * Verify the prompt article row matches the URL's project + prompt. Returns
 * the row on success, or a NextResponse on not-found. Uses 404 on mismatch to
 * avoid leaking which row IDs exist.
 *
 * The ok-flag discriminator (rather than `instanceof NextResponse`) keeps the
 * branch reliable in test environments where module boundaries can put
 * `NextResponse` into different constructor scopes.
 */
async function loadPromptArticleWithOwnershipCheck(
  promptArticleId: string,
  projectId: string,
  promptId: string
): Promise<OwnershipResult> {
  const row = await getPromptArticleRowWithId(promptArticleId);
  if (!row || row.project_id !== projectId || row.prompt_id !== promptId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Prompt article not found', code: 'PROMPT_ARTICLE_NOT_FOUND' },
        { status: 404 }
      ),
    };
  }
  return { ok: true, row };
}

/**
 * POST: stream a freshly generated article from the outline + competitor
 * sources, persist on `onFinish` with finishReason='stop' atomically into
 * article_markdown / sources_used / outline_used / article_model_id and reset
 * user_edited_article_markdown to null.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Request lifecycle                                              │
 *   │  client click → POST → ownership → cache-on-read?              │
 *   │   ├─ yes (article_markdown set, no force) → JSON body          │
 *   │   └─ no  → resolve opportunity → streamText → tokens to client │
 *   │                                          ↘ onFinish(stop)     │
 *   │                                            atomic UPDATE      │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * `consumeStream()` is intentionally NOT called: client navigation aborts via
 * `req.signal`, which cancels the LLM call and skips persistence (we don't pay
 * for output the user will never see).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { projectId, promptId, promptArticleId } = await params;
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    if (!promptId) return NextResponse.json({ error: 'Missing promptId' }, { status: 400 });
    if (!promptArticleId)
      return NextResponse.json({ error: 'Missing promptArticleId' }, { status: 400 });

    const parsedBody = PostBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid body', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }
    const forceRegenerate = parsedBody.data.forceRegenerate ?? false;

    const ownership = await loadPromptArticleWithOwnershipCheck(
      promptArticleId,
      projectId,
      promptId
    );
    if (!ownership.ok) return ownership.response;
    const { row } = ownership;

    // Cache-on-read: if an article already exists and the caller didn't ask for
    // a regenerate, return both columns + sources snapshot as JSON. Client
    // distinguishes from a stream by the response Content-Type (application/json).
    if (!forceRegenerate && row.article_markdown !== null) {
      return NextResponse.json({
        articleMarkdown: row.article_markdown,
        userEditedArticleMarkdown: row.user_edited_article_markdown,
        sourcesUsed: row.sources_used,
        outlineUsed: row.outline_used,
        isExisting: true,
      });
    }

    // Need to derive opportunity sources to feed the LLM. Re-derive from current
    // date-range opportunity state; this matches what the user is currently
    // looking at on the page. The snapshot we persist (sources_used) freezes
    // these sources to this article, even if competitor ranks shift later.
    const projectRow = await getProjectRowWithId(projectId);
    if (!projectRow) {
      throw new PromptArticleError('UNAUTHORIZED', 'Project not found or unauthorized.');
    }

    const promptRow = await getPromptRowWithId(promptId);
    if (!promptRow || promptRow.project_id !== projectId) {
      throw new PromptArticleError('PROMPT_NOT_FOUND', 'This prompt no longer exists.');
    }

    const defaultDateRange = getDefaultAnalysisDateRange();
    const startDateISO = parsedBody.data.startDate
      ? getISODateString(parsedBody.data.startDate)
      : defaultDateRange.startDateISO;
    const endDateISO = parsedBody.data.endDate
      ? getISODateString(parsedBody.data.endDate)
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
      row.opportunity_type as OutlineOpportunityType,
      row.target_source_clean_url
    );

    let normalized: ResolvedOpportunity | null = null;
    if (opportunity) {
      if (!OUTLINE_OPPORTUNITY_TYPES.includes(opportunity.type as OutlineOpportunityType)) {
        throw new PromptArticleError('OPPORTUNITY_NOT_FOUND', 'Unsupported opportunity type.');
      }
      normalized = normalizeOpportunityForGeneration(opportunity, promptId);
    } else if (
      row.opportunity_type === 'ProjectSourceNotFoundOpportunity' &&
      row.target_source_clean_url === null
    ) {
      // Mirror the outline route: a Create-content article generation can run
      // for any prompt, including those filtered out of the opportunity listing
      // (e.g. when project sources are already cited).
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
        'The opportunity for this prompt article no longer exists for the current date range.'
      );
    }
    const eligibleSources = filterEligibleSources(normalized.sourcesToInspireFrom);
    if (eligibleSources.length === 0) {
      throw new PromptArticleError(
        'NOT_ENOUGH_SOURCES',
        'None of the cited sources have inspiration headings yet. Try back after the next analysis run.'
      );
    }

    // Use the user-edited outline if present, otherwise the AI version. This
    // is what we snapshot into outline_used so the article is auditable.
    const outlineUsed = row.user_edited_outline ?? row.outline;

    // Title + URL + description only — no headings, by design.
    const sourcesForPrompt: ArticleSourceForPrompt[] = eligibleSources.map((s) => ({
      title: s.title ?? s.cleanUrl,
      cleanUrl: s.cleanUrl,
      description: s.description,
    }));
    const sourcesUsed: ArticleSourcesUsed = {
      sources: sourcesForPrompt,
    };


    const result = await startArticleStream(
      {
        projectName: projectRow.name,
        projectDomain: projectRow.hostname,
        promptName: promptRow.name,
        outline: outlineUsed,
        sourcesToReference: sourcesForPrompt,
        settings: {
          targetWordCount: row.target_word_count,
          styleGuide: row.style_guide,
          pagesToLink: row.pages_to_link,
          targetKeywords: row.target_keywords,
        },
      },
      {
        abortSignal: req.signal,
        onFinish: async ({ text, finishReason }) => {
          if (finishReason !== 'stop') {
            // Length-truncated, errored, content-filtered, tool-calls, other:
            // skip persistence. The text stream may have already delivered
            // partial bytes to the client; client refetches the row to detect
            // failure (article_markdown will still be null or unchanged).
            // The 'other' finishReason on AI SDK v6 covers the abort case.
            return;
          }

          // ATOMIC: one UPDATE writes article_markdown, sources_used,
          // outline_used, article_model_id, and resets user_edited_article_markdown
          // to null. If the DB call fails, NONE of these land — no half-written row.
          await setArticleGeneratedFromStream(promptArticleId, {
            articleMarkdown: text,
            sourcesUsed,
            outlineUsed,
            articleModelId: ARTICLE_MODEL_ID,
          });

        },
      }
    );

    return result.toTextStreamResponse();
  } catch (error) {
    if (error instanceof PromptArticleError) {
      const status = errorCodeToStatus(error.code);
      if (status >= 500) {
        console.error(error);
      }
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    // Detect rate-limit / busy from upstream gateway by string match.
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (
      message.includes('rate') ||
      message.includes('429') ||
      message.includes('503') ||
      message.includes('overload') ||
      message.includes('busy')
    ) {
      return NextResponse.json(
        {
          error: 'The article generation service is busy. Try again in a moment.',
          code: 'ARTICLE_GENERATION_RATE_LIMIT',
        },
        { status: 503 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: persist user edits to the article OR restore-to-AI by setting null.
 * Mirrors the outline PATCH route's shape and ownership chain.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { projectId, promptId, promptArticleId } = await params;
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    if (!promptId) return NextResponse.json({ error: 'Missing promptId' }, { status: 400 });
    if (!promptArticleId)
      return NextResponse.json({ error: 'Missing promptArticleId' }, { status: 400 });

    const parsed = PatchBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid article payload',
          code: 'VALIDATION_FAILED',
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const ownership = await loadPromptArticleWithOwnershipCheck(
      promptArticleId,
      projectId,
      promptId
    );
    if (!ownership.ok) return ownership.response;

    const updated = await updatePromptArticleUserEditedMarkdown(
      promptArticleId,
      parsed.data.userEditedArticleMarkdown
    );

    return NextResponse.json({ promptArticle: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
