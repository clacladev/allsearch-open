import type { ArticleOutline, ArticleOutlineHeadingTag } from '@/libs/database/PromptArticles/types';

const TAG_DEPTH: Record<ArticleOutlineHeadingTag, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};

/**
 * Convert an outline into markdown. Each heading becomes a `#`-prefixed line
 * matching its tag level, followed by a blank line and the keyPoint as a
 * single bullet. Suitable for pasting into any markdown-aware editor.
 */
export function outlineToMarkdown(outline: ArticleOutline): string {
  if (!outline.headings.length) return '';

  return outline.headings
    .map((heading) => {
      const depth = TAG_DEPTH[heading.tag] ?? 1;
      const prefix = '#'.repeat(depth);
      const keyPointLine = heading.keyPoint.trim();
      return keyPointLine
        ? `${prefix} ${heading.text}\n\n${keyPointLine}`
        : `${prefix} ${heading.text}`;
    })
    .join('\n\n');
}
