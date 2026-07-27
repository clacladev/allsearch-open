import type { ArticleOutlineHeading } from '@/libs/database/PromptArticles/types';

/**
 * Returns true when an edited heading differs from its corresponding original
 * (matched by array index, since reorder is not in scope). When there is no
 * corresponding original (the user added a row), the heading is treated as
 * edited.
 */
export function isHeadingEdited(
  edited: ArticleOutlineHeading,
  original: ArticleOutlineHeading | undefined
): boolean {
  if (!original) return true;
  return (
    edited.tag !== original.tag ||
    edited.text !== original.text ||
    edited.keyPoint !== original.keyPoint
  );
}
