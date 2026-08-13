'use client';

import { useEffect, useRef } from 'react';
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  linkPlugin,
  linkDialogPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  ListsToggle,
  UndoRedo,
  Separator,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { cn } from '@/libs/utils/cn';

type Props = {
  initialMarkdown: string;
  /** Bumping this calls setMarkdown so an external restore rehydrates the editor. */
  resetVersion: number;
  /** Fired on every edit. Caller is responsible for debouncing/persistence. */
  onChange: (markdown: string) => void;
  isDisabled?: boolean;
  /**
   * When defined, the editor is being driven by an in-flight article stream.
   * On each change, the editor's content is rewritten via setMarkdown on a
   * trailing throttle so Lexical doesn't reparse 60×/sec. onChange is
   * suppressed for streaming-induced setMarkdown calls so they don't bubble
   * up as user edits and trigger autosave.
   */
  streamingMarkdown?: string;
};

const STREAMING_FLUSH_MS = 250;

/**
 * MDXEditor-backed WYSIWYG markdown editor. Source of truth is markdown
 * (so Copy/Download .md and the autosave PATCH route stay unchanged).
 *
 * Why a separate file from EditableArticle: MDXEditor is heavy and uses Lexical,
 * which touches `window` at import. Loading via next/dynamic with ssr:false in
 * EditableArticle keeps the editor out of the SSR pass and out of the initial
 * bundle for routes that don't need it.
 */
export function MarkdownArticleEditor({
  initialMarkdown,
  resetVersion,
  onChange,
  isDisabled,
  streamingMarkdown,
}: Props) {
  const editorRef = useRef<MDXEditorMethods>(null);

  // MDXEditor reads `markdown` prop only on mount. After a Restore-AI we need
  // to push the new value through the imperative method.
  const lastResetVersionRef = useRef(resetVersion);
  useEffect(() => {
    if (lastResetVersionRef.current === resetVersion) return;
    lastResetVersionRef.current = resetVersion;
    editorRef.current?.setMarkdown(initialMarkdown);
  }, [resetVersion, initialMarkdown]);

  // Stream chunks into the editor on a trailing throttle. Lexical reparses
  // the whole document on every setMarkdown, which is too expensive at the
  // ~60Hz cadence the streaming hook flushes at; ~4Hz is plenty for the user
  // to read along. The `applyingStreamingRef` flag tells onChange to ignore
  // the resulting change event so it doesn't look like a user edit.
  const applyingStreamingRef = useRef(false);
  const pendingStreamingRef = useRef<string | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (streamingMarkdown === undefined) {
      // Streaming ended. Drop any pending throttled write — the parent bumps
      // `resetVersion` on the streaming → editable transition, which resyncs
      // the editor from the freshly fetched article_markdown. Flushing here
      // would race that resync (effects run in declaration order, reset
      // effect first, streaming effect second) and overwrite it.
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      pendingStreamingRef.current = null;
      return;
    }
    pendingStreamingRef.current = streamingMarkdown;
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      const next = pendingStreamingRef.current;
      if (next === null) return;
      pendingStreamingRef.current = null;
      applyingStreamingRef.current = true;
      editorRef.current?.setMarkdown(next);
      queueMicrotask(() => {
        applyingStreamingRef.current = false;
      });
    }, STREAMING_FLUSH_MS);
  }, [streamingMarkdown]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, []);

  return (
    <MDXEditor
      ref={editorRef}
      markdown={initialMarkdown}
      onChange={(value, isInitialNormalize) => {
        if (isInitialNormalize) return;
        if (applyingStreamingRef.current) return;
        onChange(value);
      }}
      readOnly={isDisabled || streamingMarkdown !== undefined}
      contentEditableClassName={cn(
        'prose md:prose-lg text-primary max-w-none px-4 py-4 sm:px-5 sm:py-5 focus:outline-none',
        isDisabled && 'pointer-events-none opacity-60'
      )}
      className="mdx-editor-allsearch"
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarClassName: 'mdx-editor-allsearch-toolbar',
          toolbarContents: () => (
            <>
              <UndoRedo />
              <Separator />
              <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
              <Separator />
              <BlockTypeSelect />
              <Separator />
              <ListsToggle options={['bullet', 'number']} />
              <Separator />
              <CreateLink />
            </>
          ),
        }),
      ]}
    />
  );
}

export default MarkdownArticleEditor;
