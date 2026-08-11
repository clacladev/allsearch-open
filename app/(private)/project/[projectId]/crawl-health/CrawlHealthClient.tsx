'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/base/buttons/button';
import { RouteHelper, ROUTES } from '@/libs/routes';
import { RefreshCcw01 } from '@untitledui/icons';

type BotRow = {
  name: string;
  operator: string;
  purpose: string;
  allowed: boolean;
  matchedAgents: string[] | null;
};

type CheckResult = {
  url: string;
  errorCategory: string | null;
  errorMessage: string | null;
  robotsTxt: {
    robotsUrl: string;
    status: number;
    noRobotsTxt: boolean;
    bots: BotRow[];
    error: string | null;
  } | null;
  pageResponse: {
    finalUrl: string;
    status: number;
    ok: boolean;
    redirectChain: string[];
    error: string | null;
  } | null;
  rendering: {
    htmlBytes: number;
    visibleTextLength: number;
    hasMeaningfulContent: boolean;
    likelyClientSide: boolean;
    detectedFrameworks: string[];
  } | null;
  structuredData: {
    jsonLd: Array<{ type: string; valid: boolean }>;
    openGraphCount: number;
    twitterCardCount: number;
    hasAnyStructuredData: boolean;
  } | null;
};

type Props = {
  projectId: string;
  projectName: string;
  url: string;
};

export function CrawlHealthClient({ projectId, projectName, url }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  const runCheck = useCallback(async () => {
    if (!url?.trim()) {
      setError('This project has no brand URL. Add one in project settings.');
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ROUTES.API.AI_CRAWL_CHECKER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as CheckResult & { error?: string };
      if (!res.ok && data.error && !data.errorCategory) {
        setError(data.error);
        setResult(null);
        return;
      }
      setResult(data);
      if (data.errorMessage) {
        setError(data.errorMessage);
      }
    } catch {
      setError('Could not reach the crawl checker.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  const brandSettingsHref = RouteHelper.Project.Settings.getBrand(projectId);

  if (!url?.trim()) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-secondary bg-primary p-4 text-sm text-secondary">
          <p className="font-semibold text-primary">Missing brand URL</p>
          <p className="mt-1">
            {projectName} has no URL to check.{' '}
            <Link href={brandSettingsHref} className="underline">
              Set the brand URL
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tertiary">
          Checking <span className="font-medium text-primary">{url}</span>
        </p>
        <Button
          size="sm"
          color="secondary"
          iconLeading={RefreshCcw01}
          isDisabled={loading}
          onClick={() => void runCheck()}
        >
          {loading ? 'Checking…' : 'Re-run check'}
        </Button>
      </div>

      {loading && !result && (
        <p className="text-sm text-tertiary">Running crawl checks…</p>
      )}

      {error && (
        <div className="rounded-xl border border-secondary bg-primary p-4 text-sm">
          <p className="font-semibold text-primary">Check issue</p>
          <p className="mt-1 text-secondary">{error}</p>
        </div>
      )}

      {result && !result.errorCategory && (
        <div className="grid gap-4 md:grid-cols-2">
          <Section title="Page response">
            {result.pageResponse ? (
              <ul className="space-y-1 text-sm text-secondary">
                <li>
                  Status:{' '}
                  <span className="font-medium text-primary">
                    {result.pageResponse.status}
                    {result.pageResponse.ok ? ' (ok)' : ''}
                  </span>
                </li>
                <li className="break-all">
                  Final URL: {result.pageResponse.finalUrl}
                </li>
                {result.pageResponse.redirectChain.length > 1 && (
                  <li>
                    Redirects: {result.pageResponse.redirectChain.length - 1}
                  </li>
                )}
                {result.pageResponse.error && (
                  <li className="text-primary">{result.pageResponse.error}</li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-tertiary">No page response data.</p>
            )}
          </Section>

          <Section title="robots.txt bot access">
            {result.robotsTxt ? (
              <div className="space-y-2">
                {result.robotsTxt.noRobotsTxt && (
                  <p className="text-sm text-tertiary">
                    No robots.txt found — bots are treated as allowed by default.
                  </p>
                )}
                {result.robotsTxt.error && (
                  <p className="text-sm text-primary">{result.robotsTxt.error}</p>
                )}
                <ul className="divide-y divide-secondary rounded-lg border border-secondary">
                  {result.robotsTxt.bots.map((bot) => (
                    <li
                      key={bot.name}
                      className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium text-primary">{bot.name}</div>
                        <div className="text-xs text-tertiary">
                          {bot.operator} · {bot.purpose}
                        </div>
                      </div>
                      <span
                        className={
                          bot.allowed
                            ? 'shrink-0 font-medium text-success-primary'
                            : 'shrink-0 font-medium text-error-primary'
                        }
                      >
                        {bot.allowed ? 'Allowed' : 'Blocked'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-tertiary">No robots.txt data.</p>
            )}
          </Section>

          <Section title="Rendering">
            {result.rendering ? (
              <ul className="space-y-1 text-sm text-secondary">
                <li>
                  Meaningful content:{' '}
                  <span className="font-medium text-primary">
                    {result.rendering.hasMeaningfulContent ? 'Yes' : 'No'}
                  </span>
                </li>
                <li>
                  Likely client-side shell:{' '}
                  {result.rendering.likelyClientSide ? 'Yes' : 'No'}
                </li>
                <li>Visible text length: {result.rendering.visibleTextLength}</li>
                <li>HTML bytes: {result.rendering.htmlBytes}</li>
                {result.rendering.detectedFrameworks.length > 0 && (
                  <li>
                    Frameworks: {result.rendering.detectedFrameworks.join(', ')}
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-tertiary">No rendering data.</p>
            )}
          </Section>

          <Section title="Structured data">
            {result.structuredData ? (
              <ul className="space-y-1 text-sm text-secondary">
                <li>
                  Any structured data:{' '}
                  <span className="font-medium text-primary">
                    {result.structuredData.hasAnyStructuredData ? 'Yes' : 'No'}
                  </span>
                </li>
                <li>Open Graph tags: {result.structuredData.openGraphCount}</li>
                <li>Twitter card tags: {result.structuredData.twitterCardCount}</li>
                {result.structuredData.jsonLd.length > 0 && (
                  <li>
                    JSON-LD:{' '}
                    {result.structuredData.jsonLd
                      .map((j) => `${j.type}${j.valid ? '' : ' (invalid)'}`)
                      .join(', ')}
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-tertiary">No structured data section.</p>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-secondary bg-primary p-4 shadow-xs">
      <h2 className="mb-3 text-sm font-semibold text-primary">{title}</h2>
      {children}
    </section>
  );
}
