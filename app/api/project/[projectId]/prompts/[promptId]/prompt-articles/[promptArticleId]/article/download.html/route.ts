import { NextRequest, NextResponse } from 'next/server';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { getUserOrThrow } from '@/libs/database/supabase/server';
import { getPromptArticleRowWithId } from '@/libs/database/PromptArticles/queries';
import { getPromptRowWithId } from '@/libs/database/Prompts/queries';

/**
 * Conservative allowlist for the downloaded HTML. We expose this file to
 * whatever CMS the user pastes into, so we strip absolutely anything that can
 * execute (script, iframe, object, embed, on* handlers, javascript: URLs).
 * The output is plain semantic HTML the user's CMS will style.
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
    code: ['class'], // allow language-* class for syntax highlighting in CMS
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
  // Drop everything that doesn't match the allowlist.
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

function wrapInDocument(bodyHtml: string, titleAttr: string): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${sanitizeHtml(titleAttr, { allowedTags: [], allowedAttributes: {} })}</title>`,
    '</head>',
    '<body>',
    bodyHtml,
    '</body>',
    '</html>',
  ].join('\n');
}

/**
 * GET download.html — converts the user's current article (user-edited if set,
 * otherwise the AI version) to sanitized standalone HTML. The route is the
 * download mechanism: the client uses an `<a href download>` and the browser
 * picks up Content-Disposition.
 *
 * `marked` runs server-side here to keep ~110KB of conversion+sanitizer libs
 * out of the client bundle. The trade-off: one round-trip per download click.
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

    const user = await getUserOrThrow();
    const row = await getPromptArticleRowWithId(promptArticleId);
    if (
      !row ||
      row.author_id !== user.id ||
      row.project_id !== projectId ||
      row.prompt_id !== promptId
    ) {
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
    const filename = `article-${slugify(titleAttr)}.html`;

    // marked.parse with async: false avoids a Promise return type mismatch for
    // the typical synchronous markdown body. With markdown that has nothing
    // requiring async resolution this is safe; for safety we await .parse and
    // accept the Promise<string> return shape.
    const rawHtml = await marked.parse(currentMarkdown);
    const sanitized = sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
    const document = wrapInDocument(sanitized, titleAttr);


    return new NextResponse(document, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
