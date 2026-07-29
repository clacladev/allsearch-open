import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import {
  getPromptArticleRowWithId,
  updatePromptArticleOutlineEdits,
  updatePromptArticleSettings,
} from '@/libs/database/PromptArticles/queries';
import {
  articleSettingsPartialSchema,
  PersistedOutlineSchema,
} from '@/libs/ai/promptArticles/schema';

// PATCH accepts EITHER an outline edit OR a settings edit (not both in one
// request). The two paths persist into different columns and are driven by
// different surfaces (outline editor vs settings panel), so keeping them as
// separate top-level keys makes the schema and handler simpler than a merged
// object.
const BodySchema = z.union([
  z.object({ userEditedOutline: PersistedOutlineSchema.nullable() }),
  z.object({ settings: articleSettingsPartialSchema }),
]);

type RouteParams = { projectId: string; promptId: string; promptArticleId: string };

/**
 * Read a single prompt-article row. Used by the article view's post-stream
 * refetch to load `sources_used` / `outline_used` and to detect generation
 * failure (article_markdown stays null when onFinish skipped persistence).
 * Same ownership-chain check as PATCH; 404 on mismatch (no info leak).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { projectId, promptId, promptArticleId } = await params;
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    if (!promptId) return NextResponse.json({ error: 'Missing promptId' }, { status: 400 });
    if (!promptArticleId)
      return NextResponse.json({ error: 'Missing promptArticleId' }, { status: 400 });

    const row = await getPromptArticleRowWithId(promptArticleId);
    if (!row || row.project_id !== projectId || row.prompt_id !== promptId) {
      return NextResponse.json(
        { error: 'Prompt article not found', code: 'PROMPT_ARTICLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ promptArticle: row });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

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

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid outline payload',
          code: 'VALIDATION_FAILED',
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const row = await getPromptArticleRowWithId(promptArticleId);
    if (!row) {
      return NextResponse.json(
        { error: 'Prompt article not found', code: 'PROMPT_ARTICLE_NOT_FOUND' },
        { status: 404 }
      );
    }
    if (row.project_id !== projectId || row.prompt_id !== promptId) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    let updated;
    if ('userEditedOutline' in parsed.data) {
      updated = await updatePromptArticleOutlineEdits(
        promptArticleId,
        parsed.data.userEditedOutline
      );
    } else {
      const { settings } = parsed.data;
      // Empty style_guide → null so the column reflects "no guide" rather than
      // an empty string. Other fields pass through unchanged.
      const styleGuide =
        settings.styleGuide === undefined
          ? undefined
          : settings.styleGuide.trim().length
            ? settings.styleGuide
            : null;
      updated = await updatePromptArticleSettings(promptArticleId, {
        targetWordCount: settings.targetWordCount,
        styleGuide,
        pagesToLink: settings.pagesToLink,
        targetKeywords: settings.targetKeywords,
      });
    }

    return NextResponse.json({ promptArticle: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
