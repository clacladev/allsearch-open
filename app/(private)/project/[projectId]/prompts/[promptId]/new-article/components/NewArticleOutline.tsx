'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  FilePenLine,
  RefreshCcw,
  RefreshCw,
  Search,
} from 'lucide-react';
import useSWRMutation from 'swr/mutation';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ConfirmModal } from '@/app/(private)/components/ConfirmModal';
import { appFetch, AppFetchError } from '@/hooks/appFetch';
import { useClipboard } from '@/hooks/use-clipboard';
import { RouteHelper, ROUTES } from '@/libs/routes';
import { isAiErrorCode, type AiErrorCode } from '@/libs/ai/errors';
import { AiFailureState, getAiFailureStateCopy } from '@/app/components/AiFailureState';
import { cx } from '@/utils/cx';
import type { ArticleSettings } from '@/libs/ai/promptArticles/schema';
import type { ArticleSourcesUsed, PromptArticleRow } from '@/libs/database/PromptArticles/types';
import type { OutlineOpportunityType } from '@/libs/utils/project-analysis/types';
import { outlineToMarkdown } from '@/libs/utils/articleOutlineMarkdown';
import { ArticleSettingsForm } from './ArticleSettingsForm';
import { CitationsPanel } from './CitationsPanel';
import { EditableOutlineCard } from './EditableOutlineCard';
import { OutlineContextHeader } from './OutlineContextHeader';
import { OutlineSettingsPanel } from './OutlineSettingsPanel';
import { RestoreOutlineDialog } from './RestoreOutlineDialog';
import { SaveStatusPill } from './SaveStatusPill';
import { useOutlineAutosave } from '../hooks/useOutlineAutosave';

type OutlineErrorKind = 'NOT_ENOUGH_SOURCES' | 'OPPORTUNITY_GONE' | 'RATE_LIMIT' | 'GENERIC';

type Props = {
  projectId: string;
  projectDomain: string;
  promptId: string;
  opportunityId: string | undefined;
  opportunityType: OutlineOpportunityType | undefined;
  targetSourceCleanUrl: string | null;
  promptName: string;
  startDate?: string;
  endDate?: string;
  /**
   * Sources whose heading structure inspired the outline. Same shape as the
   * generated article's `sources_used` so we can render them through the same
   * CitationsPanel for visual parity. Null when the opportunity is unresolved.
   */
  inspirationSources: ArticleSourcesUsed | null;
  initialOutline: PromptArticleRow | null;
  backHref: string;
  backLabel: string;
};

type GenerateArticleOutlineArgs = {
  opportunityType: OutlineOpportunityType;
  opportunityId: string | undefined;
  targetSourceCleanUrl: string | null;
  startDate?: string;
  endDate?: string;
  settings: ArticleSettings;
};

type GeneratePromptArticleResponse = {
  promptArticle: PromptArticleRow;
};

/** Narrows to one of the three AI-credential codes (issue 09) when the outline POST's `toAiError`
 * layer classified the failure that way; `undefined` for every other `OutlineErrorKind`, which
 * keeps its existing copy below. */
function classifyAiErrorCode(error: unknown): AiErrorCode | undefined {
  return error instanceof AppFetchError && isAiErrorCode(error.code) ? error.code : undefined;
}

function classifyOutlineError(error: unknown): OutlineErrorKind {
  if (error instanceof AppFetchError) {
    if (error.code === 'NOT_ENOUGH_SOURCES') return 'NOT_ENOUGH_SOURCES';
    if (error.code === 'PROMPT_NOT_FOUND' || error.code === 'OPPORTUNITY_NOT_FOUND')
      return 'OPPORTUNITY_GONE';
    if (error.code === 'GENERATION_RATE_LIMIT' || error.status === 503 || error.status === 429)
      return 'RATE_LIMIT';
  }
  return 'GENERIC';
}

const OUTLINE_ERROR_COPY: Record<
  OutlineErrorKind,
  {
    title: string;
    description: string;
    icon: typeof AlertCircle;
    canRetry: boolean;
  }
> = {
  NOT_ENOUGH_SOURCES: {
    title: 'Not enough source data yet',
    description:
      "This prompt doesn't have cited sources with readable page headings to inspire an outline. Try back after the next analysis run.",
    icon: Search,
    canRetry: false,
  },
  OPPORTUNITY_GONE: {
    title: 'This opportunity is no longer available',
    description:
      'The prompt or opportunity may have changed in the selected date range. Return to the opportunities list and try again.',
    icon: AlertTriangle,
    canRetry: false,
  },
  RATE_LIMIT: {
    title: 'Generation service is busy',
    description: 'The outline service is busy right now. Try again in a moment.',
    icon: AlertCircle,
    canRetry: true,
  },
  GENERIC: {
    title: 'Failed to generate the outline',
    description: 'Something went wrong while generating your outline. Try again in a moment.',
    icon: AlertCircle,
    canRetry: true,
  },
};

const OUTLINE_REGEN_ERROR_COPY: Record<OutlineErrorKind, string> = {
  NOT_ENOUGH_SOURCES:
    'Not enough source data yet to regenerate. Try back after the next analysis run.',
  OPPORTUNITY_GONE: 'This opportunity is no longer available. Return to the opportunities list.',
  RATE_LIMIT: 'The outline service is busy. Try again in a moment.',
  GENERIC: 'Failed to generate a new outline. Try again in a moment.',
};

const useGenerateArticleOutline = (projectId: string, promptId: string) => {
  const url = RouteHelper.Api.Project.getPromptArticles(projectId, promptId);
  return useSWRMutation<
    GeneratePromptArticleResponse,
    Error,
    readonly [string, string],
    GenerateArticleOutlineArgs
  >(['generate-article-outline', promptId], (_key, { arg }) =>
    appFetch<GeneratePromptArticleResponse>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      },
      'Failed to generate outline'
    )
  );
};

export function NewArticleOutline({
  projectId,
  projectDomain,
  promptId,
  opportunityId,
  opportunityType,
  targetSourceCleanUrl,
  promptName,
  startDate,
  endDate,
  inspirationSources,
  initialOutline,
  backHref,
  backLabel,
}: Props) {
  const router = useRouter();
  const [outline, setOutline] = useState<PromptArticleRow | null>(initialOutline);
  const [errorKind, setErrorKind] = useState<OutlineErrorKind | null>(null);
  const [aiErrorCode, setAiErrorCode] = useState<AiErrorCode | undefined>(undefined);
  // Settings the user picked for the next regenerate. Initialized to the
  // current row's persisted settings so Regenerate uses the latest panel state.
  const [pendingRegenerateSettings, setPendingRegenerateSettings] =
    useState<ArticleSettings | null>(null);
  const { copied, copy } = useClipboard();

  const { trigger: triggerOutlineGeneration, isMutating: isMutatingOutline } =
    useGenerateArticleOutline(projectId, promptId);

  const requestOutlineGeneration = async (isRegeneration: boolean, settings: ArticleSettings) => {
    if (!opportunityType) return;
    setErrorKind(null);
    setAiErrorCode(undefined);
    try {
      const response = await triggerOutlineGeneration({
        opportunityType,
        opportunityId,
        targetSourceCleanUrl,
        startDate,
        endDate,
        settings,
      });
      setOutline(response.promptArticle);
      setPendingRegenerateSettings(null);
      // Pin the URL to the freshly inserted row so a reload loads that exact
      // row instead of triggering another insert. Same goes for Regenerate:
      // the URL must follow the visible row.
      const nextHref = RouteHelper.Project.getPromptNewArticle(
        projectId,
        promptId,
        opportunityId,
        response.promptArticle.id,
        startDate,
        endDate
      );
      router.replace(nextHref);
      if (isRegeneration) {
      }
    } catch (error) {
      setAiErrorCode(classifyAiErrorCode(error));
      setErrorKind(classifyOutlineError(error));
    }
  };

  // The opportunity couldn't be found for the current date range.
  if (!opportunityType) {
    return (
      <div className="flex w-full items-center justify-center py-12">
        <div className="flex min-h-[600px] flex-col items-center justify-center gap-4 py-16 text-center">
          <AlertTriangle className="text-muted-foreground size-8" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold">This opportunity is no longer available</h2>
            <p className="text-muted-foreground">
              The opportunity may have changed in the selected date range. Return to the
              opportunities list and try again.
            </p>
          </div>
          <Link href={backHref}>
            <Button variant="secondary">{backLabel}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // First-load: no row yet → render the settings form. The user picks settings,
  // submits, and we POST /prompt-articles which creates the row + generates the
  // outline. While the POST is in flight, the form shows isSubmitting.
  if (!outline) {
    return (
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href={backHref}>
            <Button variant="secondary" size="sm">
              <ArrowLeft aria-hidden="true" />
              {backLabel}
            </Button>
          </Link>
        </div>

        {isMutatingOutline ? (
          <div className="flex min-h-96 w-full items-center justify-center py-12">
            <Spinner aria-label="Generating your outline..." />
          </div>
        ) : aiErrorCode ? (
          <AiFailureState code={aiErrorCode} provider="google" className="min-h-[400px] py-16" />
        ) : errorKind ? (
          (() => {
            const errorCopy = OUTLINE_ERROR_COPY[errorKind];
            return (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-16 text-center">
                <errorCopy.icon className="text-muted-foreground size-8" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-semibold">{errorCopy.title}</h2>
                  <p className="text-muted-foreground">{errorCopy.description}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={backHref}>
                    <Button variant="secondary">{backLabel}</Button>
                  </Link>
                  {errorCopy.canRetry && (
                    <Button onClick={() => setErrorKind(null)}>
                      Adjust settings and try again
                    </Button>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <ArticleSettingsForm
            projectDomain={projectDomain}
            isSubmitting={isMutatingOutline}
            onSubmit={(settings) => void requestOutlineGeneration(false, settings)}
          />
        )}
      </div>
    );
  }

  return (
    <OutlineEditor
      key={outline.id}
      outline={outline}
      setOutline={setOutline}
      projectId={projectId}
      projectDomain={projectDomain}
      promptId={promptId}
      opportunityId={opportunityId}
      opportunityType={opportunityType}
      startDate={startDate}
      endDate={endDate}
      promptName={promptName}
      inspirationSources={inspirationSources}
      isMutatingOutline={isMutatingOutline}
      errorKind={errorKind}
      aiErrorCode={aiErrorCode}
      onCopy={copy}
      copied={copied}
      pendingRegenerateSettings={pendingRegenerateSettings}
      onPendingRegenerateSettingsChange={setPendingRegenerateSettings}
      onRegenerate={(settings) => void requestOutlineGeneration(true, settings)}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}

type EditorProps = {
  outline: PromptArticleRow;
  setOutline: (row: PromptArticleRow) => void;
  projectId: string;
  projectDomain: string;
  promptId: string;
  opportunityId: string | undefined;
  opportunityType: OutlineOpportunityType;
  startDate?: string;
  endDate?: string;
  promptName: string;
  inspirationSources: ArticleSourcesUsed | null;
  isMutatingOutline: boolean;
  errorKind: OutlineErrorKind | null;
  aiErrorCode: AiErrorCode | undefined;
  onCopy: (text: string) => void;
  copied: string | boolean;
  /** Settings buffered for the *next* outline regenerate. Stored at the parent
   * so they survive remounts of the editor when a new row arrives. */
  pendingRegenerateSettings: ArticleSettings | null;
  onPendingRegenerateSettingsChange: (settings: ArticleSettings | null) => void;
  onRegenerate: (settings: ArticleSettings) => void;
  backHref: string;
  backLabel: string;
};

function OutlineEditor({
  outline,
  setOutline,
  projectId,
  projectDomain,
  promptId,
  opportunityId,
  opportunityType,
  startDate,
  endDate,
  promptName,
  inspirationSources,
  isMutatingOutline,
  errorKind,
  aiErrorCode,
  onCopy,
  copied,
  pendingRegenerateSettings,
  onPendingRegenerateSettingsChange,
  onRegenerate,
  backHref,
  backLabel,
}: EditorProps) {
  const inspirationSourceCount = inspirationSources?.sources.length ?? 0;
  const router = useRouter();
  // Currently-displayed outline = user_edited_outline ?? outline
  const initialEditable = outline.user_edited_outline ?? outline.outline;

  const [currentOutline, setCurrentOutline] = useState(initialEditable);
  const [hasLocalEdits, setHasLocalEdits] = useState(outline.user_edited_outline !== null);
  // Bumping this remounts EditableOutlineCard so its internal _uid/headings
  // state is rebuilt from `currentOutline`. Used after Restore.
  const [resetVersion, setResetVersion] = useState(0);

  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);

  const autosave = useOutlineAutosave({
    projectId,
    promptId,
    outlineId: outline.id,
    outline: currentOutline,
    onSaved: (row) => setOutline(row),
  });

  const handleEdit = (
    next: typeof currentOutline,
    kind: Parameters<typeof autosave.notifyEdit>[0]
  ) => {
    setCurrentOutline(next);
    setHasLocalEdits(true);
    autosave.notifyEdit(kind);
  };

  const handleCopy = () => {
    const markdown = outlineToMarkdown(currentOutline);
    onCopy(markdown);
  };

  const handleRestoreConfirm = async () => {
    setIsRestoring(true);
    try {
      const restored = await autosave.restore();
      setCurrentOutline(restored.outline);
      setHasLocalEdits(false);
      setResetVersion((v) => v + 1);
      setIsRestoreOpen(false);
    } catch {
      // The autosave hook surfaces its own error state; the dialog stays open
      // so the user can retry manually.
    } finally {
      setIsRestoring(false);
    }
  };

  // Settings to apply on the next regenerate. The user may tweak the panel
  // before clicking Regenerate; pendingRegenerateSettings holds those edits.
  // Falling back to the row's persisted settings keeps Regenerate working when
  // the user hasn't touched the panel.
  const settingsForNextRegenerate = (): ArticleSettings =>
    pendingRegenerateSettings ?? {
      targetWordCount: outline.target_word_count,
      styleGuide: outline.style_guide ?? '',
      pagesToLink: outline.pages_to_link,
      targetKeywords: outline.target_keywords,
    };

  const handleRegenerateClick = async () => {
    if (hasLocalEdits) {
      setIsRegenerateOpen(true);
      return;
    }
    onRegenerate(settingsForNextRegenerate());
  };

  const handleRegenerateConfirm = async () => {
    await autosave.flush();
    setIsRegenerateOpen(false);
    onRegenerate(settingsForNextRegenerate());
  };

  // Generate Article: flush any pending outline edits so the article is
  // generated from the saved-to-DB outline, then navigate to the article-view
  // branch with ?generate=1 so the page server-component re-renders into
  // ArticleView with auto-start streaming. router.refresh isn't enough on its
  // own because the row's article_markdown is still null at this point.
  const handleGenerateArticleClick = async () => {
    await autosave.flush();
    const baseHref = RouteHelper.Project.getPromptNewArticle(
      projectId,
      promptId,
      opportunityId,
      outline.id,
      startDate,
      endDate
    );
    const separator = baseHref.includes('?') ? '&' : '?';
    router.push(`${baseHref}${separator}generate=1`);
  };

  return (
    <div className="flex w-full max-w-180 flex-col gap-4">
      <OutlineContextHeader
        promptName={promptName}
        opportunityType={opportunityType}
        inspirationSourceCount={inspirationSourceCount}
        startDate={startDate}
        endDate={endDate}
      />

      {aiErrorCode ? (
        <div className="border-error_subtle bg-error-primary text-error-primary flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
          <span>{getAiFailureStateCopy(aiErrorCode, 'google').description}</span>
          <Link href={ROUTES.SETTINGS} className="font-medium underline">
            Go to Settings
          </Link>
        </div>
      ) : (
        errorKind && (
          <div className="border-error_subtle bg-error-primary text-error-primary rounded-lg border p-3 text-sm">
            {OUTLINE_REGEN_ERROR_COPY[errorKind]}
          </div>
        )
      )}

      {/* Top action bar: nav left, document actions right. Mirrors the article
          view so the two surfaces feel consistent and Regenerate / Generate
          aren't buried under a long outline. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={backHref}>
          <Button variant="secondary" size="sm">
            <ArrowLeft aria-hidden="true" />
            {backLabel}
          </Button>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={isMutatingOutline}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy markdown'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isMutatingOutline}
            onClick={handleRegenerateClick}
          >
            {isMutatingOutline ? <Spinner aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
            Regenerate
          </Button>
          {hasLocalEdits && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsRestoreOpen(true)}
              disabled={isMutatingOutline || isRestoring}
            >
              <RefreshCcw aria-hidden="true" />
              Restore AI version
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => void handleGenerateArticleClick()}
            disabled={isMutatingOutline}
          >
            <FilePenLine aria-hidden="true" />
            Generate article
          </Button>
        </div>
      </div>

      <div className="relative">
        {/* Pill floats in the card's top-right padding area so it never pushes
            the context strip or shifts the rows below. pointer-events-none
            keeps the first-row trash button clickable when the pill overlaps. */}
        <SaveStatusPill
          state={autosave.state}
          onRetry={() => void autosave.retry()}
          className="pointer-events-none absolute top-3 right-4 z-10 sm:top-4 sm:right-5"
        />
        <div
          className={cx(
            'transition-opacity',
            isMutatingOutline && 'pointer-events-none opacity-50'
          )}
        >
          <EditableOutlineCard
            key={`${outline.id}-${resetVersion}`}
            initialOutline={currentOutline}
            originalOutline={outline.outline}
            onChange={handleEdit}
            isDisabled={isMutatingOutline}
          />
        </div>
        {isMutatingOutline && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <Spinner aria-label="Generating new outline..." />
          </div>
        )}
      </div>

      <OutlineSettingsPanel
        projectId={projectId}
        projectDomain={projectDomain}
        promptId={promptId}
        promptArticle={outline}
        onPersisted={(row) => {
          setOutline(row);
          // Once the panel persists, drop any pending buffer — the row is now
          // the source of truth and the panel re-derives from it.
          onPendingRegenerateSettingsChange(null);
        }}
        onPendingChange={onPendingRegenerateSettingsChange}
      />

      <CitationsPanel
        sourcesUsed={inspirationSources}
        ariaLabel="Sources that inspired this outline"
        caption="The heading structure of these sources inspired this outline."
      />

      <RestoreOutlineDialog
        isOpen={isRestoreOpen}
        setIsOpen={setIsRestoreOpen}
        isLoading={isRestoring}
        onConfirm={handleRestoreConfirm}
      />

      <ConfirmModal
        isOpen={isRegenerateOpen}
        setIsOpen={setIsRegenerateOpen}
        variant="confirm"
        title="Regenerate the outline?"
        description="Your current edits stay saved on this outline but won't appear on the new one. Continue?"
        actionLabel="Regenerate"
        isLoading={false}
        action={() => void handleRegenerateConfirm()}
      />
    </div>
  );
}
