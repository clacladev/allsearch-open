'use client';

import { ChevronDown, Download01 } from '@untitledui/icons';
import posthog from 'posthog-js';
import { Button } from '@/components/base/buttons/button';
import { Dropdown } from '@/components/base/dropdown/dropdown';
import { RouteHelper } from '@/libs/routes';

type Props = {
  projectId: string;
  promptId: string;
  outlineId: string;
  promptName: string;
  /** Current article markdown (user-edited if set, otherwise AI version). */
  currentMarkdown: string;
  isDisabled?: boolean;
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
 * Single Download button with a dropdown menu containing .md, .html, .docx, .pdf.
 *
 *  - .md: pure client-side Blob download. The current markdown lives in props,
 *    no server round-trip needed.
 *  - .html / .docx / .pdf: server routes do markdown→target. Browser handles
 *    the download via Content-Disposition. Keeps marked + sanitize-html +
 *    html-to-docx + pdfmake out of the client bundle.
 *
 * Why a menu rather than side-by-side buttons: the article action bar has up
 * to four actions (Download, Regenerate, Restore, Back). Multiple download
 * buttons inflate the row past the editor's max-width and force ugly wrapping
 * on narrower viewports.
 */
export function ArticleDownloadButtons({
  projectId,
  promptId,
  outlineId,
  promptName,
  currentMarkdown,
  isDisabled,
}: Props) {
  const handleDownloadMd = () => {
    const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const filename = `article-${slugify(promptName)}.md`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    posthog.capture('article_downloaded', {
      project_id: projectId,
      prompt_id: promptId,
      prompt_article_id: outlineId,
      format: 'markdown',
    });
  };

  const htmlDownloadUrl = RouteHelper.Api.Project.getPromptArticleBodyDownloadHtml(
    projectId,
    promptId,
    outlineId
  );
  const docxDownloadUrl = RouteHelper.Api.Project.getPromptArticleBodyDownloadDocx(
    projectId,
    promptId,
    outlineId
  );
  const pdfDownloadUrl = RouteHelper.Api.Project.getPromptArticleBodyDownloadPdf(
    projectId,
    promptId,
    outlineId
  );

  // The server routes fire their own PostHog event, so no client capture here.
  // Using location.assign rather than window.open avoids opening a new tab
  // for a Content-Disposition: attachment response.
  const handleDownloadHtml = () => window.location.assign(htmlDownloadUrl);
  const handleDownloadDocx = () => window.location.assign(docxDownloadUrl);
  const handleDownloadPdf = () => window.location.assign(pdfDownloadUrl);

  return (
    <Dropdown.Root>
      <Button
        color="tertiary"
        size="sm"
        iconLeading={Download01}
        iconTrailing={ChevronDown}
        isDisabled={isDisabled}
        aria-label="Download article"
      >
        Download
      </Button>
      <Dropdown.Popover className="w-44">
        <Dropdown.Menu>
          <Dropdown.Item label="Markdown (.md)" onAction={handleDownloadMd} />
          <Dropdown.Item label="HTML (.html)" onAction={handleDownloadHtml} />
          <Dropdown.Item label="Word (.docx)" onAction={handleDownloadDocx} />
          <Dropdown.Item label="PDF (.pdf)" onAction={handleDownloadPdf} />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
