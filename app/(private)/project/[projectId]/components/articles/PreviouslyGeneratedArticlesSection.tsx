'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, FileCheck02 } from '@untitledui/icons';
import { Badge } from '@/components/base/badges/badges';
import { Button } from '@/components/base/buttons/button';
import { RouteHelper } from '@/libs/routes';
import type { PromptArticleRow } from '@/libs/database/PromptArticles/types';
import type { PromptRow } from '@/libs/database/Prompts/types';
import { OPPORTUNITY_TYPE_NAME } from '@/libs/utils/opportunities';
import type { OpportunityType } from '@/libs/utils/project-analysis/types';

const MINUTE_MS = 60_000;

function formatRelativeTime(fromIso: string, now: number): string {
  const diff = Math.max(0, now - new Date(fromIso).getTime());
  if (diff < 30_000) return 'just now';
  if (diff < MINUTE_MS) return 'less than a minute ago';
  const minutes = Math.round(diff / MINUTE_MS);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

type ArticleStatus = {
  label: string;
  color: 'gray' | 'brand' | 'success';
};

function getArticleStatus(article: PromptArticleRow): ArticleStatus {
  if (article.user_edited_article_markdown != null) {
    return { label: 'Article edited', color: 'success' };
  }
  if (article.article_markdown != null) {
    return { label: 'Article generated', color: 'success' };
  }
  if (article.user_edited_outline != null) {
    return { label: 'Outline edited', color: 'brand' };
  }
  return { label: 'Outline drafted', color: 'gray' };
}

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-md text-primary font-semibold">{title}</p>
    <p className="text-tertiary text-sm">{description}</p>
  </div>
);

export const PreviouslyGeneratedArticlesSection = ({
  projectId,
  articles,
  prompts,
  showPromptName = false,
  description,
  startDate,
  endDate,
}: {
  projectId: string;
  articles: PromptArticleRow[];
  prompts: PromptRow[];
  /** When true, show the prompt name in each row (useful when grouping isn't already by prompt). */
  showPromptName?: boolean;
  description: string;
  startDate?: string;
  endDate?: string;
}) => {
  // Refresh relative timestamps on window focus only.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const onFocus = () => setNow(Date.now());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (!articles.length) return null;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Previously generated articles" description={description} />

      <div className="border-secondary rounded-xl border">
        <ul className="divide-border-secondary divide-y">
          {articles.map((article) => {
            const prompt = prompts.find((p) => p.id === article.prompt_id);
            const status = getArticleStatus(article);
            const href = RouteHelper.Project.getPromptNewArticle(
              projectId,
              article.prompt_id,
              article.opportunity_id ?? undefined,
              article.id,
              startDate,
              endDate
            );
            return (
              <li
                key={article.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <FileCheck02 className="text-quaternary size-4 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-primary truncate text-sm font-medium">
                      {showPromptName
                        ? (prompt?.name ?? 'Unknown prompt')
                        : (OPPORTUNITY_TYPE_NAME[article.opportunity_type as OpportunityType] ??
                          'Article')}
                    </p>
                    {article.target_source_clean_url && (
                      <p className="text-tertiary truncate text-xs">
                        {article.target_source_clean_url}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge color={status.color}>{status.label}</Badge>
                  <span className="text-tertiary hidden text-xs sm:inline">
                    {formatRelativeTime(article.updated_at, now)}
                  </span>
                  <Button href={href} color="tertiary" size="xs" iconTrailing={ArrowRight}>
                    Open
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
