'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { cx } from '@/utils/cx';
import { Spinner } from '@/components/ui/spinner';
import { SaveStatusPill } from './SaveStatusPill';
import { useArticleAutosave } from '../hooks/useArticleAutosave';
import type { PromptArticleRow } from '@/libs/database/PromptArticles/types';

// MDXEditor uses Lexical, which touches `window` at import. Loading via
// next/dynamic with ssr:false keeps it out of the SSR pass and out of the
// initial client bundle for routes that don't render the article view.
const MarkdownArticleEditor = dynamic(
  () => import('./MarkdownArticleEditor').then((m) => m.MarkdownArticleEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner aria-label="Loading editor..." />
      </div>
    ),
  }
);

type Props = {
  projectId: string;
  promptId: string;
  outlineId: string;
  initialMarkdown: string;
  /** Bumping this rehydrates the editor with initialMarkdown after a restore. */
  resetVersion?: number;
  onSaved: (row: PromptArticleRow) => void;
  onAutosaveChange: (autosave: ReturnType<typeof useArticleAutosave>) => void;
  isDisabled?: boolean;
  /**
   * When true, an article stream is in-flight: the editor stays mounted but
   * read-only, autosave is suppressed, and content is driven by
   * `streamingMarkdown` rather than user input.
   */
  isStreaming?: boolean;
  /**
   * Latest streamed markdown. Forwarded to the editor for throttled
   * imperative updates while `isStreaming` is true. Should be undefined when
   * not streaming.
   */
  streamingMarkdown?: string;
};

/**
 * WYSIWYG markdown editor for the generated article. Markdown stays the
 * source of truth (Copy as markdown / Download .md / autosave PATCH all
 * round-trip the raw string). The editor renders headings, links, lists,
 * etc. inline as the user types, in the spirit of Medium's editor.
 */
export function EditableArticle({
  projectId,
  promptId,
  outlineId,
  initialMarkdown,
  resetVersion = 0,
  onSaved,
  onAutosaveChange,
  isDisabled,
  isStreaming = false,
  streamingMarkdown,
}: Props) {
  const [markdown, setMarkdown] = useState(initialMarkdown);

  const autosave = useArticleAutosave({
    projectId,
    promptId,
    outlineId,
    articleMarkdown: markdown,
    onSaved,
  });

  useEffect(() => {
    onAutosaveChange(autosave);
  }, [autosave, onAutosaveChange]);

  // Sync local state when the parent forces a rehydrate (Restore AI).
  useEffect(() => {
    setMarkdown(initialMarkdown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetVersion]);

  const handleChange = useCallback(
    (value: string) => {
      if (isStreaming) return;
      setMarkdown(value);
      autosave.notifyEdit();
    },
    [autosave, isStreaming]
  );

  return (
    <div className="border-secondary relative max-w-180 rounded-xl border">
      {/* SaveStatusPill is z-20 so it floats above the sticky toolbar (z-10).
          Positioned at the card's top-right corner; visually overlaps the
          toolbar when present, fine because the pill is small + auto-dismisses. */}
      <SaveStatusPill
        state={autosave.state}
        onRetry={() => void autosave.retry()}
        className="pointer-events-none absolute top-2 right-3 z-20"
      />
      <div
        className={cx('mdx-editor-allsearch-host', isDisabled && 'pointer-events-none opacity-60')}
        aria-label="Article markdown editor"
      >
        <MarkdownArticleEditor
          initialMarkdown={initialMarkdown}
          resetVersion={resetVersion}
          onChange={handleChange}
          isDisabled={isDisabled}
          streamingMarkdown={streamingMarkdown}
        />
      </div>
    </div>
  );
}
