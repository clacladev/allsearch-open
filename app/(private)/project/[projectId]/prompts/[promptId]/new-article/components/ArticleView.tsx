'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  RefreshCcw01,
  RefreshCw02,
  XSquare,
} from '@untitledui/icons';
import posthog from 'posthog-js';
import { Button } from '@/components/base/buttons/button';
import { ConfirmModal } from '@/app/(private)/components/ConfirmModal';
import { EmptyState } from '@/components/application/empty-state/empty-state';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import type { PromptArticleRow } from '@/libs/database/PromptArticles/types';
import type { OutlineOpportunityType } from '@/libs/utils/project-analysis/types';
import { CitationsPanel } from './CitationsPanel';
import { EditableArticle } from './EditableArticle';
import { ArticleDownloadButtons } from './ArticleDownloadButtons';
import { OutlineContextHeader } from './OutlineContextHeader';
import { RestoreArticleDialog } from './RestoreArticleDialog';
import { useArticleStreaming } from '../hooks/useArticleStreaming';
import type { useArticleAutosave } from '../hooks/useArticleAutosave';

type Mode = 'pre-generate' | 'streaming' | 'editable';

type Props = {
  projectId: string;
  promptId: string;
  outlineId: string;
  promptName: string;
  opportunityType: OutlineOpportunityType;
  /**
   * Date range the outline view was rendered with. Forwarded to the streaming
   * hook so the server resolves the same opportunity sources the user saw on
   * the outline page, not the project's default window.
   */
  startDate?: string;
  endDate?: string;
  initialOutlineRow: PromptArticleRow;
  /**
   * When true, immediately start streaming on mount instead of rendering the
   * pre-generate state. Set when the user clicks Generate Article on the
   * outline editor and lands on this view via ?generate=1.
   */
  autoStartStreaming?: boolean;
  inspirationSourceCount: number;
  backToOutlineHref: string;
};

const READ_WPM = 220; // average adult reading speed; rounded for display

function computeReadTime(markdown: string): string {
  const wc = markdown.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wc / READ_WPM));
  return `${minutes} min read`;
}

/**
 * Orchestrator for the article view: handles the pre-generate → streaming →
 * editable mode transitions, the smart pin-to-bottom auto-scroll during
 * streaming, the action bar swap on each mode, and surfacing the citations
 * panel after onFinish.
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ Mode transitions                                                  │
 *   │  pre-generate ──Generate Article──▶ streaming                    │
 *   │       ▲                                  │                        │
 *   │       └────────────────error─────────────┤                        │
 *   │                                          ▼                        │
 *   │                                       editable                    │
 *   │                                          │                        │
 *   │                                Regenerate Article                 │
 *   │                                          ▼                        │
 *   │                                       streaming                   │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * The page server component decides whether to mount us in pre-generate
 * (article_markdown null) or editable (article_markdown set) by passing the
 * current row. We never mount in 'streaming' from the server; that's an
 * in-flight client state.
 *
 * Layout choice: action buttons live in a single top action bar above the
 * editor, not below it. A 2000-word article would otherwise bury Regenerate /
 * Download / Restore behind a long scroll, and the row was prone to wrap on
 * narrower viewports because of `max-w-180`.
 */
export function ArticleView({
  projectId,
  promptId,
  outlineId,
  promptName,
  opportunityType,
  startDate,
  endDate,
  initialOutlineRow,
  autoStartStreaming = false,
  inspirationSourceCount,
  backToOutlineHref,
}: Props) {
  const [outlineRow, setOutlineRow] = useState(initialOutlineRow);

  // Initial mode: editable if the row already has an article (cache-on-read),
  // else pre-generate. autoStartStreaming kicks the pre-generate mode into
  // streaming on mount via the effect below.
  const [mode, setMode] = useState<Mode>(() =>
    initialOutlineRow.article_markdown ? 'editable' : 'pre-generate'
  );

  // Bumping this remounts EditableArticle so initialMarkdown rehydrates after restore.
  const [resetVersion, setResetVersion] = useState(0);

  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Captured from EditableArticle so action bar can flush autosave before
  // regenerate, and Restore AI button can call autosave.restore().
  const articleAutosaveRef = useRef<ReturnType<typeof useArticleAutosave> | null>(null);

  // Smart pin-to-bottom: true when we're auto-scrolling; false when user has
  // scrolled up. Updated on every scroll event during streaming.
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);

  // Refetch the row after stream completes to load sources_used + outline_used
  // and detect failures (article_markdown still null = generation failed).
  const refetchRow = useCallback(async () => {
    const url = RouteHelper.Api.Project.getPromptArticle(
      projectId,
      promptId,
      outlineId
    );
    const result = await appFetch<{ promptArticle: PromptArticleRow }>(
      url,
      { method: 'GET' },
      'Failed to load article'
    );
    return result.promptArticle;
  }, [outlineId, projectId, promptId]);

  const stream = useArticleStreaming({
    projectId,
    promptId,
    outlineId,
    startDate,
    endDate,
    onStreamComplete: () => {
      // Stream closed cleanly. Refetch to confirm article_markdown landed.
      void (async () => {
        try {
          const fresh = await refetchRow();
          if (fresh.article_markdown) {
            setOutlineRow(fresh);
            // Bump resetVersion so the editor re-syncs from the freshly
            // fetched article_markdown. The editor already shows the streamed
            // text; this is a defensive resync covering any server-side
            // post-processing divergence.
            setResetVersion((v) => v + 1);
            setMode('editable');
          } else {
            // Stream ended but server didn't persist. Treat as failure.
            stream.reset();
            setMode('pre-generate');
          }
        } catch {
          stream.reset();
          setMode('pre-generate');
        }
      })();
    },
  });

  const handleGenerate = async (forceRegenerate: boolean) => {
    setMode('streaming');
    // Bump resetVersion so the (already-mounted) editor clears its old content
    // synchronously when we re-enter streaming from editable mode (regenerate).
    // Without this, the editor would keep showing the previous article for up
    // to 250ms — the streaming throttle interval — before the first chunk
    // overwrites it. No-op when arriving from pre-generate (fresh mount).
    setResetVersion((v) => v + 1);
    setIsPinnedToBottom(true);
    const result = await stream.start({ forceRegenerate });
    // Cache-on-read fast-path: server returned existing article as JSON.
    if (result.cached) {
      setOutlineRow((prev) => ({
        ...prev,
        article_markdown: result.cached!.articleMarkdown,
        user_edited_article_markdown: result.cached!.userEditedArticleMarkdown,
        sources_used: result.cached!.sourcesUsed,
        outline_used: result.cached!.outlineUsed,
      }));
      setMode('editable');
    }
    if (forceRegenerate) {
      posthog.capture('article_regenerated', {
        project_id: projectId,
        prompt_id: promptId,
        prompt_article_id: outlineId,
      });
    }
  };

  const handleStop = () => {
    stream.stop();
    setMode('pre-generate');
  };

  const handleRegenerateClick = async () => {
    // If user has unsaved edits, confirm before destroying them.
    const hasLocalEdits = outlineRow.user_edited_article_markdown !== null;
    if (hasLocalEdits) {
      setIsRegenerateConfirmOpen(true);
      return;
    }
    await handleGenerate(true);
  };

  const handleRegenerateConfirm = async () => {
    // Flush any in-flight autosave first so the user's last edits aren't lost
    // mid-regenerate.
    if (articleAutosaveRef.current) {
      await articleAutosaveRef.current.flush();
    }
    setIsRegenerateConfirmOpen(false);
    await handleGenerate(true);
  };

  const handleRestoreConfirm = async () => {
    if (!articleAutosaveRef.current) {
      setIsRestoreOpen(false);
      return;
    }
    setIsRestoring(true);
    try {
      const updated = await articleAutosaveRef.current.restore();
      setOutlineRow(updated);
      setResetVersion((v) => v + 1);
      setIsRestoreOpen(false);
    } catch {
      // Hook surfaces error via state machine; dialog stays open.
    } finally {
      setIsRestoring(false);
    }
  };

  // Auto-start streaming on mount when arriving via ?generate=1. We fire
  // forceRegenerate=false so a cache-on-read returns the existing article
  // (e.g., user double-clicked Generate). Guard with hasAutoStartedRef so
  // we never auto-start more than once even if the parent re-renders.
  const hasAutoStartedRef = useRef(false);
  useEffect(() => {
    if (!autoStartStreaming) return;
    if (hasAutoStartedRef.current) return;
    if (initialOutlineRow.article_markdown) return; // cache-on-read covers this
    hasAutoStartedRef.current = true;
    void handleGenerate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartStreaming]);

  // Smart pin-to-bottom: keep auto-scrolling unless the user manually scrolls
  // up. The streaming view lets the page scroll naturally (no inner overflow
  // box), so we listen on the window rather than a fixed-height container.
  useEffect(() => {
    if (mode !== 'streaming') return;
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight;
      const isAtBottom =
        docHeight - window.scrollY - window.innerHeight < 24;
      setIsPinnedToBottom(isAtBottom);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mode]);

  // While streaming, keep the page scrolled to bottom on each chunk.
  useEffect(() => {
    if (mode !== 'streaming') return;
    if (!isPinnedToBottom) return;
    window.scrollTo({ top: document.documentElement.scrollHeight });
  }, [stream.displayedMarkdown, mode, isPinnedToBottom]);

  const currentMarkdown =
    outlineRow.user_edited_article_markdown ?? outlineRow.article_markdown ?? '';

  const wordCountForStrip = useMemo(() => {
    if (mode === 'streaming') {
      return stream.wordCount > 0
        ? `${stream.wordCount.toLocaleString()} words written`
        : undefined;
    }
    if (mode === 'editable' && currentMarkdown) {
      const wc = currentMarkdown.trim().split(/\s+/).filter(Boolean).length;
      return `${wc.toLocaleString()} words · ${computeReadTime(currentMarkdown)}`;
    }
    return undefined;
  }, [mode, stream.wordCount, currentMarkdown]);

  const hasLocalEdits = outlineRow.user_edited_article_markdown !== null;

  const isPreGenerate = mode === 'pre-generate';
  const showActionBar = !isPreGenerate;

  return (
    <div className="flex w-full max-w-180 flex-col gap-4">
      <OutlineContextHeader
        promptName={promptName}
        opportunityType={opportunityType}
        inspirationSourceCount={inspirationSourceCount}
        startDate={startDate}
        endDate={endDate}
        trailingDetail={wordCountForStrip}
      />

      {showActionBar && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href={backToOutlineHref}>
            <Button color="secondary" size="sm" iconLeading={ArrowLeft}>
              Back to outline
            </Button>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {mode === 'streaming' ? (
              <Button
                color="tertiary-destructive"
                size="sm"
                iconLeading={XSquare}
                onClick={handleStop}
                aria-label="Stop article generation"
              >
                Stop generating
              </Button>
            ) : (
              currentMarkdown && (
                <>
                  <ArticleDownloadButtons
                    projectId={projectId}
                    promptId={promptId}
                    outlineId={outlineId}
                    promptName={promptName}
                    currentMarkdown={currentMarkdown}
                  />
                  <Button
                    color="tertiary"
                    size="sm"
                    iconLeading={RefreshCw02}
                    onClick={() => void handleRegenerateClick()}
                  >
                    Regenerate
                  </Button>
                  {hasLocalEdits && (
                    <Button
                      color="tertiary-destructive"
                      size="sm"
                      iconLeading={RefreshCcw01}
                      onClick={() => setIsRestoreOpen(true)}
                      isDisabled={isRestoring}
                    >
                      Restore AI version
                    </Button>
                  )}
                </>
              )
            )}
          </div>
        </div>
      )}

      {mode === 'streaming' && !isPinnedToBottom && stream.displayedMarkdown && (
        <div className="pointer-events-none fixed right-4 bottom-6 z-10 sm:right-8">
          <Button
            color="secondary"
            size="sm"
            iconLeading={ArrowDown}
            onClick={() => {
              setIsPinnedToBottom(true);
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth',
              });
            }}
            className="pointer-events-auto animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out"
          >
            Jump to latest
          </Button>
        </div>
      )}

      {isPreGenerate && stream.error && (
        <EmptyState className="py-12">
          <EmptyState.Header>
            <EmptyState.FeaturedIcon icon={AlertCircle} color="gray" />
          </EmptyState.Header>
          <EmptyState.Content>
            <EmptyState.Title>Could not generate the article</EmptyState.Title>
            <EmptyState.Description>{stream.error}</EmptyState.Description>
          </EmptyState.Content>
          <EmptyState.Footer>
            <Link href={backToOutlineHref}>
              <Button color="secondary" size="md">
                Back to outline
              </Button>
            </Link>
            <Button color="primary" size="md" onClick={() => void handleGenerate(false)}>
              Try again
            </Button>
          </EmptyState.Footer>
        </EmptyState>
      )}

      {isPreGenerate && !stream.error && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button color="primary" size="md" onClick={() => void handleGenerate(false)}>
            Generate article
          </Button>
          <Link href={backToOutlineHref}>
            <Button color="secondary" size="md">
              Back to outline
            </Button>
          </Link>
        </div>
      )}

      {mode === 'streaming' && !stream.displayedMarkdown && (
        <div className="flex min-h-40 w-full items-center justify-center py-12">
          <LoadingIndicator label="Writing your article..." />
        </div>
      )}

      {(mode === 'editable' ||
        (mode === 'streaming' && stream.displayedMarkdown)) && (
        <>
          {mode === 'editable' && currentMarkdown && (
            <article className="prose md:prose-lg text-primary sr-only max-w-180">
              <span>{`Article ready, ${currentMarkdown.trim().split(/\s+/).filter(Boolean).length} words`}</span>
            </article>
          )}
          <EditableArticle
            projectId={projectId}
            promptId={promptId}
            outlineId={outlineId}
            initialMarkdown={
              mode === 'streaming' ? stream.displayedMarkdown : currentMarkdown
            }
            resetVersion={resetVersion}
            onSaved={(row) => setOutlineRow(row)}
            onAutosaveChange={(autosave) => {
              articleAutosaveRef.current = autosave;
            }}
            isStreaming={mode === 'streaming'}
            streamingMarkdown={
              mode === 'streaming' ? stream.displayedMarkdown : undefined
            }
          />
          {mode === 'editable' && (
            <CitationsPanel sourcesUsed={outlineRow.sources_used} />
          )}
        </>
      )}

      <ConfirmModal
        isOpen={isRegenerateConfirmOpen}
        setIsOpen={setIsRegenerateConfirmOpen}
        variant="confirm"
        title="Regenerate the article?"
        description="This will replace the current article with a new one. Your edits will be lost."
        actionLabel="Regenerate"
        isLoading={false}
        action={() => void handleRegenerateConfirm()}
      />

      <RestoreArticleDialog
        isOpen={isRestoreOpen}
        setIsOpen={setIsRestoreOpen}
        isLoading={isRestoring}
        onConfirm={handleRestoreConfirm}
      />
    </div>
  );
}
