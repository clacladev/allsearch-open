'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Settings } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { type ArticleSettings, type ArticleSettingsPartial } from '@/libs/ai/promptArticles/schema';
import type { PromptArticleRow } from '@/libs/database/PromptArticles/types';
import { cn } from '@/libs/utils/cn';
import {
  ArticleSettingsFields,
  articleSettingsFromValue,
  articleSettingsToValue,
  validateArticleSettingsFieldsValue,
  type ArticleSettingsFieldsValue,
} from './ArticleSettingsFields';

const DEBOUNCE_MS = 800;

type Props = {
  projectId: string;
  projectDomain: string;
  promptId: string;
  promptArticle: PromptArticleRow;
  /** Called with the server's updated row after a successful PATCH. */
  onPersisted: (row: PromptArticleRow) => void;
  /** Called whenever the local form values diverge from the row. Lets the
   * parent buffer pending settings for the next Regenerate click without
   * waiting for the autosave to land. */
  onPendingChange: (settings: ArticleSettings | null) => void;
};

function rowToSettings(row: PromptArticleRow): ArticleSettings {
  return {
    targetWordCount: row.target_word_count,
    styleGuide: row.style_guide ?? '',
    pagesToLink: row.pages_to_link,
    targetKeywords: row.target_keywords,
  };
}

function settingsEqual(a: ArticleSettings, b: ArticleSettings): boolean {
  if (a.targetWordCount !== b.targetWordCount) return false;
  if ((a.styleGuide ?? '') !== (b.styleGuide ?? '')) return false;
  if (a.pagesToLink.length !== b.pagesToLink.length) return false;
  if (a.pagesToLink.some((p, i) => p !== b.pagesToLink[i])) return false;
  if (a.targetKeywords.length !== b.targetKeywords.length) return false;
  if (a.targetKeywords.some((k, i) => k !== b.targetKeywords[i])) return false;
  return true;
}

/**
 * Editable settings panel that lives below the outline. Auto-saves the four
 * user-controlled settings to the row via PATCH /prompt-articles/[id] with a
 * settings object. Visual + validation surface comes from ArticleSettingsFields
 * so it stays in sync with the initial-generation form.
 */
export function OutlineSettingsPanel({
  projectId,
  projectDomain,
  promptId,
  promptArticle,
  onPersisted,
  onPendingChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const [value, setValue] = useState<ArticleSettingsFieldsValue>(() =>
    articleSettingsToValue(rowToSettings(promptArticle))
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Re-sync when the row id changes (e.g. after Regenerate inserts a new row)
  // so the panel reflects the new row's persisted settings.
  const lastRowIdRef = useRef(promptArticle.id);
  useEffect(() => {
    if (lastRowIdRef.current === promptArticle.id) return;
    lastRowIdRef.current = promptArticle.id;
    setValue(articleSettingsToValue(rowToSettings(promptArticle)));
    setSaveStatus('idle');
  }, [promptArticle]);

  const validity = validateArticleSettingsFieldsValue(value);
  const isValid = validity.isValid;

  const url = RouteHelper.Api.Project.getPromptArticle(projectId, promptId, promptArticle.id);

  const persist = async (body: ArticleSettingsPartial) => {
    setSaveStatus('saving');
    try {
      const result = await appFetch<{ promptArticle: PromptArticleRow }>(
        url,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: body }),
        },
        'Failed to save settings'
      );
      onPersisted(result.promptArticle);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const debouncedPersist = useDebouncedCallback(() => {
    if (!isValid) return;
    void persist(articleSettingsFromValue(value));
  }, DEBOUNCE_MS);

  // Buffer the latest valid settings so Regenerate uses what the user just
  // typed, even if the debounce hasn't fired yet.
  useEffect(() => {
    if (!isValid) {
      onPendingChange(null);
      return;
    }
    const local = articleSettingsFromValue(value);
    const persisted = rowToSettings(promptArticle);
    onPendingChange(settingsEqual(local, persisted) ? null : local);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, promptArticle.id]);

  const handleChange = (next: ArticleSettingsFieldsValue) => {
    setValue(next);
    setSaveStatus('idle');
    debouncedPersist();
  };

  return (
    <div className="border-secondary bg-secondary/30 rounded-xl border p-4">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <Settings className="text-muted-foreground size-4" />
          <span className="text-md text-primary font-medium">Article settings</span>
          <span className="text-tertiary text-sm">
            {value.targetWordCount || promptArticle.target_word_count} words
            {' · '}
            {value.targetKeywords.length} keyword
            {value.targetKeywords.length === 1 ? '' : 's'}
            {' · '}
            {value.pagesToLink.length} link
            {value.pagesToLink.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && <span className="text-tertiary text-xs">Saving…</span>}
          {saveStatus === 'saved' && <span className="text-success-primary text-xs">Saved</span>}
          {saveStatus === 'error' && (
            <span className="text-error-primary text-xs">Save failed</span>
          )}
          <ChevronDown
            className={cn('text-fg-quaternary size-5 transition-transform', isOpen && 'rotate-180')}
          />
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 flex flex-col gap-4">
          <ArticleSettingsFields
            value={value}
            onChange={handleChange}
            projectDomain={projectDomain}
            compact
          />

          {saveStatus === 'error' && (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (!isValid) return;
                  void persist(articleSettingsFromValue(value));
                }}
              >
                Retry save
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
