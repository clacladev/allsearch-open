'use client';

import { useCallback, useRef, useState } from 'react';
import { RouteHelper } from '@/libs/routes';
import type { PromptArticleRow } from '@/libs/database/PromptArticles/types';
import { isAiErrorCode, type AiErrorCode } from '@/libs/ai/errors';
import { extractStreamError } from '@/libs/ai/promptArticles/streamErrorSentinel';

export type ArticleStreamStatus = 'idle' | 'streaming' | 'complete' | 'error';

type StartArgs = {
  forceRegenerate?: boolean;
};

type Params = {
  projectId: string;
  promptId: string;
  outlineId: string;
  /**
   * Date range the outline view was rendered with. Forwarded to the article
   * POST so the server resolves the same opportunity sources the user saw,
   * not the project's default analysis window which may be empty.
   */
  startDate?: string;
  endDate?: string;
  /**
   * Called after the stream closes. Implementer should refetch the outline row
   * via GET /article-outlines/:outlineId to confirm article_markdown landed.
   * If the row's article_markdown is still null, treat as a generation failure
   * and call setError(true).
   *
   * Why a callback rather than refetching here: the consumer owns the
   * outline-row state and decides how to merge a refreshed row.
   */
  onStreamComplete: () => void;
};

export type UseArticleStreamingResult = {
  status: ArticleStreamStatus;
  /**
   * Latest displayed markdown. Throttled at ~50ms / requestAnimationFrame so
   * react-markdown re-renders are bounded for long streams.
   */
  displayedMarkdown: string;
  /** Live word count derived from the latest accumulator (not throttled). */
  wordCount: number;
  /** Set to a string when an error has occurred (mid-stream or pre-stream). */
  error: string | null;
  /** Set alongside `error` when it's one of the three AI-credential failure states (issue 09) —
   * `undefined` for every other failure (network drop, aborted, etc.), which keeps its generic
   * `error` message. Narrowed from the pre-stream JSON error body's `code`, or from the in-stream
   * sentinel `libs/ai/promptArticles/streamErrorSentinel.ts` encodes for a mid-stream failure. */
  errorCode: AiErrorCode | undefined;
  /** Begin the stream. Returns a JSON payload if the cache-on-read path fires. */
  start: (args?: StartArgs) => Promise<{ cached: ArticleCacheHit | null }>;
  /** Abort the in-flight stream. AbortSignal cancels the server's LLM call. */
  stop: () => void;
  /** Reset to idle, clearing markdown and error. */
  reset: () => void;
};

export type ArticleCacheHit = {
  articleMarkdown: string;
  userEditedArticleMarkdown: string | null;
  sourcesUsed: PromptArticleRow['sources_used'];
  outlineUsed: PromptArticleRow['outline_used'];
  isExisting: true;
};

/**
 * Hand-rolled streaming hook. fetch() + ReadableStream + AbortController.
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ start() flow                                                     │
 *   │  ┌─────────┐  fetch  ┌─────────────────────────────────┐         │
 *   │  │ idle    │────────▶│ headers received                │         │
 *   │  └─────────┘         │  Content-Type: application/json │         │
 *   │                      │   → return cache-hit payload    │         │
 *   │                      │  Content-Type: text/plain       │         │
 *   │                      │   → reader loop                 │         │
 *   │                      └─────────────────────────────────┘         │
 *   │                                  │                                │
 *   │                                  ▼                                │
 *   │  ┌────────────┐  chunks  ┌───────────────┐  done  ┌──────────┐   │
 *   │  │ streaming  │◀─────────│ accumulator   │───────▶│ complete │   │
 *   │  └────────────┘          │ + rAF flush   │        └──────────┘   │
 *   │       │                  └───────────────┘                       │
 *   │       │ abort/error                                               │
 *   │       ▼                                                           │
 *   │  ┌─────────┐                                                      │
 *   │  │ error   │  (partial discarded; user can retry)                │
 *   │  └─────────┘                                                      │
 *   └──────────────────────────────────────────────────────────────────┘
 */
export function useArticleStreaming({
  projectId,
  promptId,
  outlineId,
  startDate,
  endDate,
  onStreamComplete,
}: Params): UseArticleStreamingResult {
  const [status, setStatus] = useState<ArticleStreamStatus>('idle');
  const [displayedMarkdown, setDisplayedMarkdown] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<AiErrorCode | undefined>(undefined);

  // Accumulator buffer holds the live string; we flush its current value to
  // displayedMarkdown on a single rAF per chunk batch. Stops react-markdown
  // from doing 50+ tree rebuilds for a 50-chunk stream.
  const accumulatorRef = useRef('');
  const rafScheduledRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const onStreamCompleteRef = useRef(onStreamComplete);
  onStreamCompleteRef.current = onStreamComplete;

  const url = RouteHelper.Api.Project.getPromptArticleBody(
    projectId,
    promptId,
    outlineId
  );

  const flushDisplay = useCallback(() => {
    rafScheduledRef.current = false;
    const text = accumulatorRef.current;
    setDisplayedMarkdown(text);
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  }, []);

  const scheduleFlush = useCallback(() => {
    if (rafScheduledRef.current) return;
    rafScheduledRef.current = true;
    requestAnimationFrame(flushDisplay);
  }, [flushDisplay]);

  const reset = useCallback(() => {
    accumulatorRef.current = '';
    rafScheduledRef.current = false;
    setDisplayedMarkdown('');
    setWordCount(0);
    setError(null);
    setErrorCode(undefined);
    setStatus('idle');
  }, []);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const start = useCallback(
    async ({ forceRegenerate = false }: StartArgs = {}) => {
      // If a previous stream is in flight, cancel it before starting a new one.
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      reset();
      setStatus('streaming');

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forceRegenerate, startDate, endDate }),
          signal: ctrl.signal,
        });
      } catch (_e) {
        // Network error or aborted before headers
        if (ctrl.signal.aborted) {
          setStatus('idle');
          return { cached: null };
        }
        setStatus('error');
        setError('Could not reach the article service. Try again.');
        return { cached: null };
      }

      if (!response.ok) {
        setStatus('error');
        try {
          const body = await response.json();
          setError(body.error ?? 'Could not generate the article.');
          setErrorCode(isAiErrorCode(body.code) ? body.code : undefined);
        } catch {
          setError('Could not generate the article.');
        }
        return { cached: null };
      }

      const contentType = response.headers.get('Content-Type') ?? '';

      // Cache-on-read: server returned existing article as JSON.
      if (contentType.includes('application/json')) {
        const cached = (await response.json()) as ArticleCacheHit;
        accumulatorRef.current = cached.userEditedArticleMarkdown ?? cached.articleMarkdown;
        scheduleFlush();
        setStatus('complete');
        onStreamCompleteRef.current();
        return { cached };
      }

      // Streaming text path.
      const body = response.body;
      if (!body) {
        setStatus('error');
        setError('No response body from article service.');
        return { cached: null };
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulatorRef.current += decoder.decode(value, { stream: true });
          scheduleFlush();
        }
        // Final decoder flush (in case of trailing multi-byte bytes).
        accumulatorRef.current += decoder.decode();

        // The route appends this sentinel instead of a clean JSON error when the credential/
        // rate-limit failure only becomes known mid-stream, after the 200 response has already
        // been sent (see streamErrorSentinel.ts). Strip it and report the same as a pre-stream
        // failure rather than a successful completion with truncated content.
        const { text: articleText, code: streamErrorCode } = extractStreamError(
          accumulatorRef.current
        );
        if (streamErrorCode) {
          accumulatorRef.current = '';
          setDisplayedMarkdown('');
          setWordCount(0);
          setStatus('error');
          setError('Could not generate the article.');
          setErrorCode(streamErrorCode);
          return { cached: null };
        }
        accumulatorRef.current = articleText;
        scheduleFlush();
        setStatus('complete');
        onStreamCompleteRef.current();
      } catch (_e) {
        if (ctrl.signal.aborted) {
          // User stopped via stop(). Return to idle; partial discarded.
          setStatus('idle');
          accumulatorRef.current = '';
          setDisplayedMarkdown('');
          setWordCount(0);
        } else {
          setStatus('error');
          setError('The connection dropped while writing the article. Try again.');
        }
      } finally {
        if (abortRef.current === ctrl) {
          abortRef.current = null;
        }
      }

      return { cached: null };
    },
    [reset, scheduleFlush, url]
  );

  // No unmount-abort effect on purpose. React Strict Mode runs cleanup once
  // synthetically in dev, which would cancel the very fetch we just started.
  // Real-world unmount paths still cancel the request:
  //  - User clicks Stop generating → stop() aborts explicitly.
  //  - User navigates → browser closes the connection → server's req.signal
  //    fires inside streamText, no orphaned LLM cost.
  //  - User starts a new generation → start() aborts the previous controller.

  return {
    status,
    displayedMarkdown,
    wordCount,
    error,
    errorCode,
    start,
    stop,
    reset,
  };
}
