'use client';

import { useRef, useState, useTransition } from 'react';
import { Input } from '@/components/base/input/input';
import { Button } from '@/components/base/buttons/button';
import { ROUTES } from '@/libs/routes';
import { appFetch } from '@/hooks/appFetch';

interface PromptGroup {
  group: string;
  prompts: string[];
}

interface PromptIdeasResult {
  url: string;
  groups: PromptGroup[];
}

export const AIProductPromptIdeasForm = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<PromptIdeasResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, startLoad] = useTransition();
  const resultRef = useRef<HTMLDivElement>(null);

  const run = (value: string) => {
    if (!value.trim() || isLoading) return;
    setSubmitError(null);
    setResult(null);
    startLoad(async () => {
      try {
        const data = await appFetch<PromptIdeasResult>(
          ROUTES.API.AI_PRODUCT_PROMPT_IDEAS,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: value }),
          },
          'Could not analyze that page'
        );
        setResult(data);
        requestAnimationFrame(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Could not analyze that page');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    run(url);
  };

  const handleChange = (value: string) => {
    setUrl(value);
    if (submitError) setSubmitError(null);
  };

  const tryExample = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setUrl('https://www.patagonia.com/shop/mens-nano-puff-hoodie');
    run('https://www.patagonia.com/shop/mens-nano-puff-hoodie');
  };

  return (
    <div className="mt-8 flex w-full flex-col items-center md:mt-12">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-start"
        aria-label="Get AI product prompt ideas"
      >
        <div className="flex-1">
          <Input
            size="md"
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck="false"
            placeholder="https://example.com/product-page"
            value={url}
            onChange={handleChange}
            validationBehavior="aria"
            isInvalid={Boolean(submitError)}
            aria-label="Product page URL"
            isDisabled={isLoading}
            hint={submitError ?? undefined}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          color="primary"
          isLoading={isLoading}
          isDisabled={!url.trim()}
          showTextWhileLoading
          className="sm:min-w-48"
        >
          {isLoading ? 'Analyzing…' : 'Get prompt ideas'}
        </Button>
      </form>

      <div className="text-quaternary mt-3 text-sm">No signup required</div>

      {!result && !isLoading && (
        <p className="text-quaternary mt-1 text-sm">
          Try{' '}
          <button
            type="button"
            onClick={tryExample}
            className="text-brand-secondary hover:text-brand-secondary_hover underline underline-offset-2"
          >
            patagonia.com/shop/mens-nano-puff-hoodie
          </button>
        </p>
      )}

      <div ref={resultRef} aria-live="polite" aria-atomic="true" className="mt-12 w-full max-w-4xl">
        {result && result.groups.length > 0 && <ResultGroups data={result} />}
      </div>
    </div>
  );
};

const ResultGroups = ({ data }: { data: PromptIdeasResult }) => {
  const totalPrompts = data.groups.reduce((sum, g) => sum + g.prompts.length, 0);
  return (
    <div className="flex flex-col gap-5">
      <div className="text-tertiary border-secondary bg-primary/60 rounded-2xl border px-5 py-4 text-left text-sm md:text-base">
        Analyzed <span className="text-primary font-semibold break-all">{data.url}</span>
        {' · '}
        <span className="text-primary font-semibold">{totalPrompts} prompts</span> in{' '}
        {data.groups.length} groups
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {data.groups.map((group) => (
          <GroupCard key={group.group} group={group} />
        ))}
      </div>
    </div>
  );
};

const GroupCard = ({ group }: { group: PromptGroup }) => (
  <section
    aria-label={group.group}
    className="border-secondary bg-primary/60 flex flex-col rounded-2xl border p-5 text-left shadow-xs md:p-6"
  >
    <h3 className="text-primary mb-3 text-base font-semibold md:text-lg">{group.group}</h3>
    <ul className="flex flex-col gap-2">
      {group.prompts.map((prompt, i) => (
        <li
          key={`${i}-${prompt}`}
          className="text-tertiary border-secondary bg-secondary flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm md:text-base"
        >
          <span className="text-quaternary mt-0.5 shrink-0 text-xs font-medium tabular-nums">
            {i + 1}.
          </span>
          <span>{prompt}</span>
        </li>
      ))}
    </ul>
  </section>
);
