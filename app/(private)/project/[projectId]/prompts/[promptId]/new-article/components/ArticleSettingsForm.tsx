'use client';

import { useState, type FormEvent } from 'react';
import { FilePenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ARTICLE_SETTINGS_DEFAULTS, type ArticleSettings } from '@/libs/ai/promptArticles/schema';
import {
  ArticleSettingsFields,
  articleSettingsFromValue,
  articleSettingsToValue,
  validateArticleSettingsFieldsValue,
  type ArticleSettingsFieldsValue,
} from './ArticleSettingsFields';

type Props = {
  /** Hostname of the current project, used to seed the pages-to-link
   * placeholder so the example URL is recognizable to the user. */
  projectDomain: string;
  initialSettings?: ArticleSettings;
  isSubmitting: boolean;
  onSubmit: (settings: ArticleSettings) => void;
  /** Optional submit-time error to surface inline above the button (e.g. when
   * the POST that creates the row failed). */
  submitError?: string;
};

export function ArticleSettingsForm({
  projectDomain,
  initialSettings,
  isSubmitting,
  onSubmit,
  submitError,
}: Props) {
  const [value, setValue] = useState<ArticleSettingsFieldsValue>(() =>
    articleSettingsToValue(initialSettings ?? ARTICLE_SETTINGS_DEFAULTS)
  );

  const validity = validateArticleSettingsFieldsValue(value);
  const canSubmit = validity.isValid && !isSubmitting;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(articleSettingsFromValue(value));
  };

  return (
    <form className="flex w-full max-w-180 flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1">
        <h2 className="text-display-xs text-primary font-semibold">Article settings</h2>
        <p className="text-md text-tertiary">
          Steer the outline and article before generating. You can edit these later.
        </p>
      </div>

      <ArticleSettingsFields value={value} onChange={setValue} projectDomain={projectDomain} />

      {submitError && (
        <div className="border-error_subtle bg-error-primary text-error-primary rounded-lg border p-3 text-sm">
          {submitError}
        </div>
      )}

      <Button type="submit" size="lg" disabled={!canSubmit}>
        {isSubmitting ? (
          <span className="animate-spin">◌</span>
        ) : (
          <FilePenLine aria-hidden="true" />
        )}
        Generate outline
      </Button>
    </form>
  );
}
