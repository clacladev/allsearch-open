import { NextRequest, NextResponse } from 'next/server';
// @ts-expect-error pdfmake ships no type declarations for the Node entry
import pdfMake from 'pdfmake/js/index.js';
// @ts-expect-error pdfmake's standard fonts file is plain JS
import standardFonts from 'pdfmake/standard-fonts/Helvetica.js';
// @ts-expect-error pdfmake's standard fonts file is plain JS
import courierFonts from 'pdfmake/standard-fonts/Courier.js';
import { getPromptArticleRowWithId } from '@/libs/database/PromptArticles/queries';
import { getPromptRowWithId } from '@/libs/database/Prompts/queries';
import { markdownToPdfmakeDoc } from '@/libs/article-export/markdownToPdfmakeDoc';

// Standard PDF base 14 fonts — no font file embedding required, no Roboto vfs.
// Helvetica + Courier cover body text and code blocks.
pdfMake.setFonts({
  ...(standardFonts as Record<string, unknown>),
  ...(courierFonts as Record<string, unknown>),
});

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'article'
  );
}

/**
 * GET download.pdf — markdown → pdfmake doc definition → .pdf via pdfmake.
 *
 * Pure JS, no Chromium, no puppeteer. Trade-off vs the .html export: tables
 * render as plain text rows and images render as a placeholder line. See
 * `markdownToPdfmakeDoc` for the rendering policy.
 *
 * Same ownership and fallback pattern as the .html and .docx routes.
 */
export async function GET(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ projectId: string; promptId: string; promptArticleId: string }> }
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

    const currentMarkdown = row.user_edited_article_markdown ?? row.article_markdown;
    if (!currentMarkdown) {
      return NextResponse.json(
        { error: 'No article generated yet', code: 'PROMPT_ARTICLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const promptRow = await getPromptRowWithId(promptId);
    const titleAttr = promptRow?.name ?? 'Article';
    const filename = `article-${slugify(titleAttr)}.pdf`;

    const docDefinition = markdownToPdfmakeDoc(currentMarkdown, titleAttr);
    const buffer: Buffer = await pdfMake.createPdf(docDefinition).getBuffer();


    const body = new Uint8Array(buffer);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(body.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
