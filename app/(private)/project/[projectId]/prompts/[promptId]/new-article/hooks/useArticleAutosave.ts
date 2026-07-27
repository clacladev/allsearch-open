'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import posthog from 'posthog-js';
import { useDebouncedCallback } from 'use-debounce';
import { appFetch, AppFetchError } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import type { PromptArticleRow } from '@/libs/database/PromptArticles/types';
import type { SaveState } from './useOutlineAutosave';

const DEBOUNCE_MS = 800;
const RETRY_DELAY_MS = 2000;
const SAVED_TO_IDLE_MS = 5000;

// Same hard cap the PATCH route enforces. Keep them in sync; if you change
// one, change the other.
const ARTICLE_MAX_CHARS = 50_000;

type Action =
  | { type: 'edit' }
  | { type: 'fire'; valid: boolean }
  | { type: 'saved'; at: string }
  | { type: 'error' }
  | { type: 'retry' }
  | { type: 'expire' };

function reducer(state: SaveState, action: Action): SaveState {
  switch (action.type) {
    case 'edit':
      return { ...state, status: 'typing' };
    case 'fire':
      return { ...state, status: action.valid ? 'saving' : 'unsaved' };
    case 'saved':
      if (state.status === 'typing') return { ...state, lastSavedAt: action.at };
      return { status: 'saved', lastSavedAt: action.at };
    case 'error':
      if (state.status === 'typing') return state;
      return { ...state, status: 'error' };
    case 'retry':
      return { ...state, status: 'saving' };
    case 'expire':
      return state.status === 'saved' ? { ...state, status: 'idle' } : state;
  }
}

type SaveResult = 'success' | 'retryable-failure' | 'permanent-failure';

type Params = {
  projectId: string;
  promptId: string;
  outlineId: string;
  /** Current article markdown. Hook always reads via ref so it never sends stale state. */
  articleMarkdown: string;
  /** Called with the server's updated row after a successful save (or restore). */
  onSaved?: (row: PromptArticleRow) => void;
};

export type UseArticleAutosaveResult = {
  state: SaveState;
  /** Notify the hook that the article markdown changed. Triggers a debounced save. */
  notifyEdit: () => void;
  /** Cancel any pending debounced save. */
  cancel: () => void;
  /**
   * Flush the pending debounced save synchronously and wait for the in-flight
   * request (if any) to settle. Used before destructive actions like
   * regenerate or restore.
   */
  flush: () => Promise<void>;
  /** Manually retry from the error state. */
  retry: () => Promise<void>;
  /**
   * Restore-to-AI: PATCH user_edited_article_markdown=null. Cancels any pending
   * debounce and resolves with the updated row.
   */
  restore: () => Promise<PromptArticleRow>;
};

/**
 * Article-edit autosave. Mirrors useOutlineAutosave's state machine and retry
 * semantics; the only differences are the body shape and the validity rule
 * (length-cap rather than schema parse).
 */
export function useArticleAutosave({
  projectId,
  promptId,
  outlineId,
  articleMarkdown,
  onSaved,
}: Params): UseArticleAutosaveResult {
  const [state, dispatch] = useReducer(reducer, {
    status: 'idle',
    lastSavedAt: null,
  } satisfies SaveState);

  const latestMarkdownRef = useRef<string>(articleMarkdown);
  latestMarkdownRef.current = articleMarkdown;

  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const inFlightRef = useRef<Promise<unknown> | null>(null);

  const url = RouteHelper.Api.Project.getPromptArticleBody(
    projectId,
    promptId,
    outlineId
  );

  const sendPatch = useCallback(
    async (body: { userEditedArticleMarkdown: string | null }): Promise<SaveResult> => {
      try {
        const promise = appFetch<{ promptArticle: PromptArticleRow }>(
          url,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
          'Failed to save article'
        );
        inFlightRef.current = promise;
        const result = await promise;
        if (onSavedRef.current) onSavedRef.current(result.promptArticle);
        return 'success';
      } catch (error) {
        if (error instanceof AppFetchError) {
          if (error.status >= 400 && error.status < 500) {
            return 'permanent-failure';
          }
        }
        return 'retryable-failure';
      } finally {
        inFlightRef.current = null;
      }
    },
    [url]
  );

  const fireSave = useCallback(async () => {
    const snapshot = latestMarkdownRef.current;
    const isValid = snapshot.length <= ARTICLE_MAX_CHARS;
    dispatch({ type: 'fire', valid: isValid });
    if (!isValid) return;

    let result = await sendPatch({ userEditedArticleMarkdown: snapshot });
    if (result === 'retryable-failure') {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      result = await sendPatch({ userEditedArticleMarkdown: latestMarkdownRef.current });
    }

    if (result === 'success') {
      const at = new Date().toISOString();
      dispatch({ type: 'saved', at });
      posthog.capture('article_edited', {
        project_id: projectId,
        prompt_id: promptId,
        prompt_article_id: outlineId,
        word_count: latestMarkdownRef.current.trim().split(/\s+/).filter(Boolean).length,
      });
    } else {
      dispatch({ type: 'error' });
    }
  }, [outlineId, projectId, promptId, sendPatch]);

  const debouncedSave = useDebouncedCallback(() => {
    void fireSave();
  }, DEBOUNCE_MS);

  const notifyEdit = useCallback(() => {
    dispatch({ type: 'edit' });
    debouncedSave();
  }, [debouncedSave]);

  const cancel = useCallback(() => {
    debouncedSave.cancel();
  }, [debouncedSave]);

  const flush = useCallback(async () => {
    debouncedSave.flush();
    if (inFlightRef.current) {
      await inFlightRef.current.catch(() => undefined);
    }
  }, [debouncedSave]);

  const retry = useCallback(async () => {
    dispatch({ type: 'retry' });
    await fireSave();
  }, [fireSave]);

  const restore = useCallback(async (): Promise<PromptArticleRow> => {
    debouncedSave.cancel();
    if (inFlightRef.current) {
      await inFlightRef.current.catch(() => undefined);
    }
    const result = await appFetch<{ promptArticle: PromptArticleRow }>(
      url,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEditedArticleMarkdown: null }),
      },
      'Failed to restore article'
    );
    dispatch({ type: 'saved', at: new Date().toISOString() });
    if (onSavedRef.current) onSavedRef.current(result.promptArticle);
    posthog.capture('article_restored', {
      project_id: projectId,
      prompt_id: promptId,
      prompt_article_id: outlineId,
    });
    return result.promptArticle;
  }, [debouncedSave, outlineId, projectId, promptId, url]);

  useEffect(() => {
    if (state.status !== 'saved') return;
    const handle = setTimeout(() => dispatch({ type: 'expire' }), SAVED_TO_IDLE_MS);
    return () => clearTimeout(handle);
  }, [state.status]);

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return { state, notifyEdit, cancel, flush, retry, restore };
}
