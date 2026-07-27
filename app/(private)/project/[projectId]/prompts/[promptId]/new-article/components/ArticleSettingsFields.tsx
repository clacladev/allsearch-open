'use client';

import { Input } from '@/components/base/input/input';
import { Label } from '@/components/base/input/label';
import { TagsInput } from '@/components/base/input/tags-input';
import {
  ARTICLE_PAGES_TO_LINK_MAX,
  ARTICLE_STYLE_GUIDE_MAX,
  ARTICLE_TARGET_KEYWORDS_MAX,
  ARTICLE_TARGET_WORD_COUNT_MAX,
  ARTICLE_TARGET_WORD_COUNT_MIN,
  type ArticleSettings,
} from '@/libs/ai/promptArticles/schema';
import { isValidUrl } from '@/libs/utils/urls';

const TOOLTIPS = {
  wordCount:
    'Roughly how long the article should be. Affects outline depth and article length.',
  styleGuide:
    "Describe how the article should sound. Voice, vocabulary you like or avoid, structure preferences, punctuation rules. Be specific: the more detail, the closer the output.",
  pagesToLink:
    'URLs we should link to inside the article. Each becomes a candidate internal link the writer will use where it fits naturally.',
  keywords:
    'SEO keywords the outline and article should naturally cover. Add one keyword or phrase per chip.',
} as const;

/**
 * Local form representation. Word count is a string so the field can be empty
 * mid-edit without losing the user's input. The wrapper components convert it
 * back to a number on submit/persist.
 */
export type ArticleSettingsFieldsValue = {
  targetWordCount: string;
  styleGuide: string;
  pagesToLink: string[];
  targetKeywords: string[];
};

export type ArticleSettingsValidity = {
  wordCountInvalid: boolean;
  styleGuideTooLong: boolean;
  isValid: boolean;
  /** The numeric word count, parsed once. NaN when invalid. */
  wordCountNumber: number;
};

export function articleSettingsFromValue(
  value: ArticleSettingsFieldsValue
): ArticleSettings {
  return {
    targetWordCount: Number(value.targetWordCount),
    styleGuide: value.styleGuide,
    pagesToLink: value.pagesToLink,
    targetKeywords: value.targetKeywords,
  };
}

export function articleSettingsToValue(
  settings: ArticleSettings
): ArticleSettingsFieldsValue {
  return {
    targetWordCount: String(settings.targetWordCount),
    styleGuide: settings.styleGuide,
    pagesToLink: settings.pagesToLink,
    targetKeywords: settings.targetKeywords,
  };
}

export function validateArticleSettingsFieldsValue(
  value: ArticleSettingsFieldsValue
): ArticleSettingsValidity {
  const wordCountNumber = Number(value.targetWordCount);
  const wordCountInvalid =
    !Number.isFinite(wordCountNumber) ||
    !Number.isInteger(wordCountNumber) ||
    wordCountNumber < ARTICLE_TARGET_WORD_COUNT_MIN ||
    wordCountNumber > ARTICLE_TARGET_WORD_COUNT_MAX;
  const styleGuideTooLong = value.styleGuide.length > ARTICLE_STYLE_GUIDE_MAX;
  return {
    wordCountInvalid,
    styleGuideTooLong,
    isValid: !wordCountInvalid && !styleGuideTooLong,
    wordCountNumber,
  };
}

type Props = {
  value: ArticleSettingsFieldsValue;
  onChange: (next: ArticleSettingsFieldsValue) => void;
  /** Project hostname, used to seed the pages-to-link placeholder. */
  projectDomain: string;
  /** When true, render compact spacing (used inside collapsible panels). */
  compact?: boolean;
};

/**
 * The four user-controlled article settings (word count, style guide, pages
 * to link, target keywords) as a single controlled fieldset. Used by both
 * ArticleSettingsForm (initial generation) and OutlineSettingsPanel (edits
 * on the outline view) so the visual + validation surface stays in sync.
 */
export function ArticleSettingsFields({ value, onChange, projectDomain, compact }: Props) {
  const validity = validateArticleSettingsFieldsValue(value);

  const set = <K extends keyof ArticleSettingsFieldsValue>(
    key: K,
    next: ArticleSettingsFieldsValue[K]
  ) => onChange({ ...value, [key]: next });

  return (
    <div className={compact ? 'flex flex-col gap-4' : 'flex flex-col gap-5'}>
      <Input
        label="Target word count"
        type="number"
        size="md"
        value={value.targetWordCount}
        onChange={(v) => set('targetWordCount', v)}
        tooltip={TOOLTIPS.wordCount}
        isInvalid={validity.wordCountInvalid}
        hint={
          validity.wordCountInvalid
            ? `Enter a whole number between ${ARTICLE_TARGET_WORD_COUNT_MIN} and ${ARTICLE_TARGET_WORD_COUNT_MAX}.`
            : undefined
        }
      />

      <div className="flex w-full flex-col gap-1.5">
        <Label tooltip={TOOLTIPS.styleGuide}>Tone & writing style</Label>
        <textarea
          rows={5}
          value={value.styleGuide}
          onChange={(e) => set('styleGuide', e.target.value)}
          placeholder="Direct, technical voice. Short paragraphs. Avoid 'leverage' and 'unlock'. Use 'we' not 'you'."
          className={
            validity.styleGuideTooLong
              ? 'ring-error_subtle focus:ring-error bg-primary text-primary placeholder:text-placeholder w-full rounded-lg px-3.5 py-2.5 text-sm shadow-xs ring-1 outline-hidden ring-inset focus:ring-2'
              : 'ring-primary focus:ring-brand bg-primary text-primary placeholder:text-placeholder w-full rounded-lg px-3.5 py-2.5 text-sm shadow-xs ring-1 outline-hidden ring-inset focus:ring-2'
          }
        />
        <div
          className={
            validity.styleGuideTooLong ? 'text-error-primary text-sm' : 'text-tertiary text-sm'
          }
        >
          {value.styleGuide.length}/{ARTICLE_STYLE_GUIDE_MAX} characters
        </div>
      </div>

      <TagsInput
        label="Pages to link"
        tooltip={TOOLTIPS.pagesToLink}
        value={value.pagesToLink}
        onChange={(next) => set('pagesToLink', next)}
        maxItems={ARTICLE_PAGES_TO_LINK_MAX}
        placeholder={`https://${projectDomain || 'brand.com'}/pricing`}
        onValidate={(raw) => (isValidUrl(raw) ? undefined : 'Enter a valid URL')}
        hint="Press Enter or comma to add a URL."
      />

      <TagsInput
        label="Target keywords"
        tooltip={TOOLTIPS.keywords}
        value={value.targetKeywords}
        onChange={(next) => set('targetKeywords', next)}
        maxItems={ARTICLE_TARGET_KEYWORDS_MAX}
        placeholder="pricing, ai chatbots, seo"
        hint="Press Enter or comma to add a keyword."
      />
    </div>
  );
}
