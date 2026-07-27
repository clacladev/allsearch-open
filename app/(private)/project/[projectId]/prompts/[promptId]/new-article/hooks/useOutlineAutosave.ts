'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import posthog from 'posthog-js';
import { useDebouncedCallback } from 'use-debounce';
import { appFetch, AppFetchError } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import {
  PersistedOutlineSchema,
  type PersistedOutline,
} from '@/libs/ai/promptArticles/schema';
import type { PromptArticleRow } from '@/libs/database/PromptArticles/types';

const DEBOUNCE_MS = 800;
const RETRY_DELAY_MS = 2000;
const SAVED_TO_IDLE_MS = 5000;

export type SaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'unsaved' | 'error';

export type EditKind = 'text' | 'keyPoint' | 'tag' | 'add' | 'delete';

export type SaveState = {
  status: SaveStatus;
  lastSavedAt: string | null;
};

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
      // If a new edit landed mid-save, the reducer will already be in 'typing'
      // by the time this dispatch arrives. Don't clobber that.
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
  outline: PersistedOutline;
  /** Called with the server's updated row after a successful save (or restore). */
  onSaved?: (row: PromptArticleRow) => void;
};

export type UseOutlineAutosaveResult = {
  state: SaveState;
  /** Notify the hook of an edit kind. Triggers a debounced save. */
  notifyEdit: (kind: EditKind) => void;
  /** Cancel any pending debounced save. */
  cancel: () => void;
  /**
   * Flush any pending debounced save synchronously and wait for the in-flight
   * request (if any) to settle. Used before destructive actions.
   */
  flush: () => Promise<void>;
  /** Manually retry from the error state. */
  retry: () => Promise<void>;
  /**
   * Restore the AI version. Cancels any pending debounce, sends a PATCH with
   * userEditedOutline=null, and resolves with the updated row.
   */
  restore: () => Promise<PromptArticleRow>;
};

export function useOutlineAutosave({
  projectId,
  promptId,
  outlineId,
  outline,
  onSaved,
}: Params): UseOutlineAutosaveResult {
  const [state, dispatch] = useReducer(reducer, {
    status: 'idle',
    lastSavedAt: null,
  } satisfies SaveState);

  // Always read the latest outline from a ref so the debounced save and any
  // mid-flight retry never send stale state.
  const latestOutlineRef = useRef<PersistedOutline>(outline);
  latestOutlineRef.current = outline;

  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  // Edit kinds since the last successful PATCH. Persists across failed
  // attempts so the eventual successful save reports every kind that
  // contributed to it.
  const editKindsRef = useRef<Set<EditKind>>(new Set());

  // Tracks the in-flight PATCH (if any) so flush()/restore() can await it.
  const inFlightRef = useRef<Promise<unknown> | null>(null);

  const url = RouteHelper.Api.Project.getPromptArticle(
    projectId,
    promptId,
    outlineId
  );

  const sendPatch = useCallback(
    async (body: { userEditedOutline: PersistedOutline | null }): Promise<SaveResult> => {
      try {
        const promise = appFetch<{ promptArticle: PromptArticleRow }>(
          url,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
          'Failed to save outline'
        );
        inFlightRef.current = promise;
        const result = await promise;
        if (onSavedRef.current) onSavedRef.current(result.promptArticle);
        return 'success';
      } catch (error) {
        if (error instanceof AppFetchError) {
          // 4xx: don't retry — surface immediately.
          if (error.status >= 400 && error.status < 500) {
            return 'permanent-failure';
          }
        }
        // 5xx + network failures: retryable.
        return 'retryable-failure';
      } finally {
        inFlightRef.current = null;
      }
    },
    [url]
  );

  const fireSave = useCallback(async () => {
    const snapshot = latestOutlineRef.current;
    const isValid = PersistedOutlineSchema.safeParse(snapshot).success;
    dispatch({ type: 'fire', valid: isValid });
    if (!isValid) return;

    const kindsAtAttempt = Array.from(editKindsRef.current).sort();
    const headingsCount = snapshot.headings.length;

    let result = await sendPatch({ userEditedOutline: snapshot });
    if (result === 'retryable-failure') {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      // The user may have kept typing during the wait; always re-read.
      result = await sendPatch({ userEditedOutline: latestOutlineRef.current });
    }

    if (result === 'success') {
      // Re-read the ref so the event reports the snapshot that actually
      // landed in the DB on the retry attempt (if any).
      const finalKinds = Array.from(editKindsRef.current).sort();
      // Use the union of kinds-at-fire and kinds-still-pending in case
      // additional edits arrived between firing and success — the next
      // debounce will pick those up, so we only flush kinds applicable to
      // *this* save. Practically, kindsAtAttempt is the authoritative set;
      // we keep finalKinds in sync (they're equal unless edits arrived).
      const reportedKinds =
        finalKinds.length >= kindsAtAttempt.length ? kindsAtAttempt : finalKinds;
      editKindsRef.current = new Set();
      const at = new Date().toISOString();
      dispatch({ type: 'saved', at });
      posthog.capture('article_outline_edited', {
        project_id: projectId,
        prompt_id: promptId,
        prompt_article_id: outlineId,
        headings_count: headingsCount,
        edit_kinds: reportedKinds,
      });
    } else {
      dispatch({ type: 'error' });
    }
  }, [outlineId, projectId, promptId, sendPatch]);

  const debouncedSave = useDebouncedCallback(() => {
    void fireSave();
  }, DEBOUNCE_MS);

  const notifyEdit = useCallback(
    (kind: EditKind) => {
      editKindsRef.current.add(kind);
      dispatch({ type: 'edit' });
      debouncedSave();
    },
    [debouncedSave]
  );

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
        body: JSON.stringify({ userEditedOutline: null }),
      },
      'Failed to restore outline'
    );
    editKindsRef.current = new Set();
    dispatch({ type: 'saved', at: new Date().toISOString() });
    if (onSavedRef.current) onSavedRef.current(result.promptArticle);
    posthog.capture('article_outline_restored', {
      project_id: projectId,
      prompt_id: promptId,
      prompt_article_id: outlineId,
    });
    return result.promptArticle;
  }, [debouncedSave, outlineId, projectId, promptId, url]);

  // Auto-expire 'saved' to 'idle' after SAVED_TO_IDLE_MS.
  useEffect(() => {
    if (state.status !== 'saved') return;
    const handle = setTimeout(() => dispatch({ type: 'expire' }), SAVED_TO_IDLE_MS);
    return () => clearTimeout(handle);
  }, [state.status]);

  // Cancel any pending save when the component unmounts.
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return { state, notifyEdit, cancel, flush, retry, restore };
}
