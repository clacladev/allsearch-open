'use client';

import { useRef, useState, useTransition } from 'react';
import { Check, X, AlertTriangle, InfoCircle } from '@untitledui/icons';
import { Input } from '@/components/base/input/input';
import { Button } from '@/components/base/buttons/button';
import { ROUTES } from '@/libs/routes';
import { appFetch } from '@/hooks/appFetch';
import type {
  CheckResult,
  RobotsTxtCheck,
  PageResponseCheck,
  RenderingCheck,
  StructuredDataCheck,
} from '@/libs/aiCrawlChecker';
import { cx } from '@/utils/cx';

const ERROR_COPY: Record<NonNullable<CheckResult['errorCategory']>, string> = {
  invalid_url: 'Enter a valid URL like example.com',
  ssrf_blocked: 'That address is not allowed',
  dns: "Couldn't resolve that hostname. Check the spelling.",
  timeout: 'The site took too long to respond. Try again.',
  http_5xx: 'The site returned an error.',
  too_large: 'That page is too large to check.',
  network: "Couldn't reach that site.",
};

type CardStatus = 'pass' | 'warn' | 'fail' | 'info';

export const AICrawlCheckerForm = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isChecking, startCheck] = useTransition();
  const resultRef = useRef<HTMLDivElement>(null);

  const runCheck = (value: string) => {
    if (!value.trim() || isChecking) return;
    setSubmitError(null);
    setResult(null);
    startCheck(async () => {
      try {
        const data = await appFetch<CheckResult>(
          ROUTES.API.AI_CRAWL_CHECKER,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: value }),
          },
          'Could not check that site'
        );
        setResult(data);
        if (!data.errorCategory) {
          requestAnimationFrame(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Could not check that site');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runCheck(url);
  };

  const handleChange = (value: string) => {
    setUrl(value);
    if (submitError) setSubmitError(null);
    if (result?.errorCategory) setResult(null);
  };

  const tryExample = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setUrl('nytimes.com');
    runCheck('nytimes.com');
  };

  const inlineError = result?.errorCategory ? ERROR_COPY[result.errorCategory] : submitError;

  return (
    <div className="mt-8 flex w-full flex-col items-center md:mt-12">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-start"
        aria-label="Check AI crawlability"
      >
        <div className="flex-1">
          <Input
            size="md"
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck="false"
            placeholder="https://yourwebsite.com"
            value={url}
            onChange={handleChange}
            validationBehavior="aria"
            isInvalid={Boolean(inlineError)}
            aria-label="Website URL"
            isDisabled={isChecking}
            hint={inlineError ?? undefined}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          color="primary"
          isLoading={isChecking}
          isDisabled={!url.trim()}
          showTextWhileLoading
          className="sm:min-w-48"
        >
          {isChecking ? 'Checking…' : 'Check AI crawlability'}
        </Button>
      </form>

      <div className="text-quaternary mt-3 text-sm">No signup required</div>

      {!result && !isChecking && (
        <p className="text-quaternary mt-1 text-sm">
          Try{' '}
          <button
            type="button"
            onClick={tryExample}
            className="text-brand-secondary hover:text-brand-secondary_hover underline underline-offset-2"
          >
            nytimes.com
          </button>
        </p>
      )}

      <div
        ref={resultRef}
        aria-live="polite"
        aria-atomic="true"
        className="mt-12 w-full max-w-4xl"
      >
        {result && !result.errorCategory && <ResultCards result={result} />}
      </div>
    </div>
  );
};

// ───────── Result composition ─────────

const ResultCards = ({ result }: { result: CheckResult }) => {
  const host = safeHost(result.url);
  return (
    <div className="flex flex-col gap-5">
      <div className="text-tertiary border-secondary bg-primary/60 rounded-2xl border px-5 py-4 text-left text-sm md:text-base">
        Checked <span className="text-primary font-semibold">{host}</span>
      </div>
      {result.pageResponse && <PageResponseCard data={result.pageResponse} />}
      {result.robotsTxt && <RobotsCard data={result.robotsTxt} />}
      {result.rendering ? (
        <RenderingCard data={result.rendering} />
      ) : (
        <UnavailableCard title="Rendering" reason="The page couldn't be loaded." />
      )}
      {result.structuredData ? (
        <StructuredDataCard data={result.structuredData} />
      ) : (
        <UnavailableCard title="Structured data" reason="The page couldn't be loaded." />
      )}
    </div>
  );
};

// ───────── Per-check cards ─────────

const PageResponseCard = ({ data }: { data: PageResponseCheck }) => {
  if (data.error) {
    return (
      <CheckCard status="fail" title="Page response" summary={data.error}>
        <DetailLine label="Final URL" value={data.finalUrl} mono />
      </CheckCard>
    );
  }

  const hops = Math.max(0, data.redirectChain.length - 1);
  const status: CardStatus = data.ok ? (hops > 1 ? 'warn' : 'pass') : 'fail';
  const summary = data.ok
    ? hops === 0
      ? `Served ${data.status} OK with no redirects.`
      : `Served ${data.status} after ${hops} redirect${hops === 1 ? '' : 's'}.`
    : `Returned HTTP ${data.status}. AI bots will see this same error.`;

  return (
    <CheckCard status={status} title="Page response" summary={summary}>
      <DetailLine label="Status" value={String(data.status)} />
      <DetailLine label="Final URL" value={data.finalUrl} mono />
      {hops > 0 && (
        <div className="mt-2">
          <p className="text-quaternary mb-1 text-xs font-medium uppercase tracking-wide">
            Redirect chain
          </p>
          <ol className="border-secondary divide-secondary text-tertiary divide-y rounded-lg border text-xs">
            {data.redirectChain.map((u, i) => (
              <li key={`${i}-${u}`} className="px-3 py-2 font-mono break-all">
                {i + 1}. {u}
              </li>
            ))}
          </ol>
        </div>
      )}
    </CheckCard>
  );
};

const RobotsCard = ({ data }: { data: RobotsTxtCheck }) => {
  if (data.error) {
    return <CheckCard status="fail" title="robots.txt bot access" summary={data.error} />;
  }

  const allowed = data.bots.filter((b) => b.allowed);
  const blocked = data.bots.filter((b) => !b.allowed);
  const status: CardStatus = data.noRobotsTxt
    ? 'pass'
    : blocked.length === 0
      ? 'pass'
      : blocked.length === data.bots.length
        ? 'fail'
        : 'warn';

  const summary = data.noRobotsTxt
    ? `No robots.txt found. Under RFC 9309, all ${data.bots.length} AI bots are allowed.`
    : blocked.length === 0
      ? `All ${data.bots.length} AI bots are allowed.`
      : `${blocked.length} of ${data.bots.length} AI bots blocked, ${allowed.length} allowed.`;

  return (
    <CheckCard status={status} title="robots.txt bot access" summary={summary}>
      <div className="mt-2 grid grid-cols-1 gap-5 md:grid-cols-2">
        <BotList tone="allowed" title="Allowed" bots={allowed} />
        <BotList tone="blocked" title="Blocked" bots={blocked} />
      </div>
    </CheckCard>
  );
};

const RenderingCard = ({ data }: { data: RenderingCheck }) => {
  const status: CardStatus = data.hasMeaningfulContent
    ? 'pass'
    : data.likelyClientSide
      ? 'fail'
      : 'warn';

  const summary = data.hasMeaningfulContent
    ? `Server-rendered: ${formatNumber(data.visibleTextLength)} characters of visible text. AI bots can read this content directly.`
    : data.likelyClientSide
      ? `Looks client-side rendered. Only ${formatNumber(data.visibleTextLength)} characters of visible text — AI bots that don't execute JavaScript will see almost nothing.`
      : `Sparse content: ${formatNumber(data.visibleTextLength)} characters of visible text.`;

  return (
    <CheckCard status={status} title="Rendering" summary={summary}>
      <DetailLine label="Visible text" value={`${formatNumber(data.visibleTextLength)} chars`} />
      <DetailLine label="HTML size" value={`${formatNumber(data.htmlBytes)} bytes`} />
      {data.detectedFrameworks.length > 0 && (
        <DetailLine
          label="Detected"
          value={data.detectedFrameworks.join(', ')}
        />
      )}
    </CheckCard>
  );
};

const StructuredDataCard = ({ data }: { data: StructuredDataCheck }) => {
  const status: CardStatus = data.jsonLd.length > 0
    ? 'pass'
    : data.hasAnyStructuredData
      ? 'warn'
      : 'info';

  const summary = data.jsonLd.length > 0
    ? `${data.jsonLd.length} JSON-LD block${data.jsonLd.length === 1 ? '' : 's'} found. AI bots can extract structured facts from this page.`
    : data.hasAnyStructuredData
      ? 'No JSON-LD, but some Open Graph or Twitter Card tags found. Add JSON-LD for richer AI grounding.'
      : 'No structured data found. Adding JSON-LD helps AI bots understand the page.';

  const types = data.jsonLd.map((j) => j.type).filter((t) => t !== 'Invalid JSON');

  return (
    <CheckCard status={status} title="Structured data" summary={summary}>
      {types.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {types.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="border-secondary bg-primary/60 text-tertiary rounded-md border px-2 py-0.5 text-xs font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <DetailLine label="JSON-LD blocks" value={String(data.jsonLd.length)} />
      <DetailLine label="Open Graph tags" value={String(data.openGraphCount)} />
      <DetailLine label="Twitter Card tags" value={String(data.twitterCardCount)} />
    </CheckCard>
  );
};

const UnavailableCard = ({ title, reason }: { title: string; reason: string }) => (
  <CheckCard status="fail" title={title} summary={reason} />
);

// ───────── Primitives ─────────

const STATUS_STYLE: Record<
  CardStatus,
  { Icon: typeof Check; iconClass: string; bgClass: string }
> = {
  pass: {
    Icon: Check,
    iconClass: 'text-success-600',
    bgClass: 'bg-success-50 dark:bg-success-100',
  },
  warn: {
    Icon: AlertTriangle,
    iconClass: 'text-warning-600',
    bgClass: 'bg-warning-50 dark:bg-warning-100',
  },
  fail: {
    Icon: X,
    iconClass: 'text-error-600',
    bgClass: 'bg-error-50 dark:bg-error-100',
  },
  info: {
    Icon: InfoCircle,
    iconClass: 'text-fg-quaternary',
    bgClass: 'bg-secondary',
  },
};

interface CheckCardProps {
  status: CardStatus;
  title: string;
  summary: string;
  children?: React.ReactNode;
}

const CheckCard = ({ status, title, summary, children }: CheckCardProps) => {
  const { Icon, iconClass, bgClass } = STATUS_STYLE[status];
  return (
    <section
      aria-label={title}
      className="border-secondary bg-primary/60 flex flex-col rounded-2xl border p-5 text-left shadow-xs md:p-6"
    >
      <header className="flex items-start gap-3">
        <span
          className={cx(
            'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
            bgClass
          )}
          aria-hidden="true"
        >
          <Icon className={cx('size-4 stroke-[2.5px]', iconClass)} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-primary text-base font-semibold md:text-lg">{title}</h3>
          <p className="text-tertiary mt-1 text-sm md:text-base">{summary}</p>
        </div>
      </header>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
};

const DetailLine = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex flex-col gap-0.5 py-1 sm:flex-row sm:items-baseline sm:gap-3">
    <span className="text-quaternary text-xs font-medium uppercase tracking-wide sm:w-40 sm:shrink-0">
      {label}
    </span>
    <span
      className={cx(
        'text-tertiary text-sm break-all',
        mono && 'font-mono text-xs'
      )}
    >
      {value}
    </span>
  </div>
);

const BotList = ({
  tone,
  title,
  bots,
}: {
  tone: 'allowed' | 'blocked';
  title: string;
  bots: RobotsTxtCheck['bots'];
}) => {
  const Icon = tone === 'allowed' ? Check : X;
  return (
    <div>
      <header className="mb-2 flex items-baseline gap-2">
        <h4 className="text-primary text-sm font-semibold">{title}</h4>
        <span className="text-quaternary text-xs font-medium">({bots.length})</span>
      </header>
      {bots.length === 0 ? (
        <p className="text-tertiary text-sm">None</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bots.map((bot) => (
            <li key={bot.name} className="flex items-start gap-2">
              <span
                className={cx(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
                  tone === 'allowed'
                    ? 'bg-success-50 text-success-600 dark:bg-success-100'
                    : 'bg-error-50 text-error-600 dark:bg-error-100'
                )}
                aria-hidden="true"
              >
                <Icon className="size-2.5 stroke-[2.5px]" />
              </span>
              <div className="min-w-0">
                <p className="text-primary text-sm font-medium">{bot.name}</p>
                <p className="text-tertiary text-xs">
                  {bot.operator} · {bot.purpose}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}
