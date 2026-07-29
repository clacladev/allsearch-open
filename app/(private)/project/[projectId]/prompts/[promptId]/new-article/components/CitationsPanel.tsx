import type { ArticleSourcesUsed } from '@/libs/database/PromptArticles/types';

type Props = {
  sourcesUsed: ArticleSourcesUsed | null;
  /**
   * Optional one-line note rendered under the eyebrow. The outline view passes
   * a sentence explaining that these sources' heading structure inspired the
   * outline; the article view omits it because the relationship is implicit.
   */
  caption?: string;
  /** Override for the nav landmark label. Defaults to the article-view phrasing. */
  ariaLabel?: string;
};

/**
 * Quiet list of sources that informed the article. Rendered as a plain
 * unordered list under a small eyebrow label so it reads as a footnote,
 * not a competing surface to the article body above.
 */
export function CitationsPanel({
  sourcesUsed,
  caption,
  ariaLabel = 'Sources informing this article',
}: Props) {
  if (!sourcesUsed || sourcesUsed.sources.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className="mt-2 max-w-180">
      <p className="text-tertiary text-xs font-medium tracking-wider uppercase">
        Sources
      </p>
      {caption && <p className="text-tertiary mt-1 text-sm">{caption}</p>}
      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-quaternary">
        {sourcesUsed.sources.map((source, index) => (
          <li key={`${source.cleanUrl}-${index}`}>
            <a
              href={`https://${source.cleanUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              title={source.cleanUrl}
              className="text-tertiary hover:text-secondary text-sm underline decoration-quaternary underline-offset-4 transition duration-100 ease-linear hover:decoration-secondary"
            >
              {source.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
