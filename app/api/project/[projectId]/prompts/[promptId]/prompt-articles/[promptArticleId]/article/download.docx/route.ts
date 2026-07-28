import { NextRequest, NextResponse } from 'next/server';
// @ts-expect-error html-to-docx ships no type declarations
import HTMLtoDOCX from 'html-to-docx';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { getPromptArticleRowWithId } from '@/libs/database/PromptArticles/queries';
import { getPromptRowWithId } from '@/libs/database/Prompts/queries';

/**
 * Conservative allowlist for the DOCX-bound HTML. Mirrors the html download
 * route so Word output matches the .html download visually.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'b', 'i', 'u', 's', 'code', 'pre', 'blockquote',
    'ul', 'ol', 'li',
    'a',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'rel', 'target'],
    code: ['class'],
    pre: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
  },
  disallowedTagsMode: 'discard',
};

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
 * GET download.docx — markdown → sanitized HTML → .docx via html-to-docx.
 * Same ownership, fallback (`user_edited_article_markdown ?? article_markdown`),
 * as the .html route.
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
    const filename = `article-${slugify(titleAttr)}.docx`;

    const rawHtml = await marked.parse(currentMarkdown);
    const sanitized = sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
    const safeTitle = sanitizeHtml(titleAttr, { allowedTags: [], allowedAttributes: {} });
    const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title></head><body>${sanitized}</body></html>`;

    const result: Buffer | Blob = await HTMLtoDOCX(fullHtml, null, {
      title: titleAttr,
      creator: 'AllSearch',
      lastModifiedBy: 'AllSearch',
    });
    // html-to-docx returns Buffer on Node and Blob on browsers; we're always Node.
    const buffer = result instanceof Buffer ? result : Buffer.from(await (result as Blob).arrayBuffer());


    const body = new Uint8Array(buffer);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
