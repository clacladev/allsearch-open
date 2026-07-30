'use client';

import { Button } from '@/components/base/buttons/button';
import { Input, InputBase } from '@/components/base/input/input';
import { useEffect, useState, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import { RouteHelper, ROUTES } from '@/libs/routes';
import { InputGroup } from '@/components/base/input/input-group';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { useDomainMetadata } from '../components/useDomainMetadata';
import FormHeader from '../components/FormHeader';
import {
  routeForStep,
  NewProjectStep,
  useNewProjectContext,
} from '../components/NewProjectContext';
import useSWRImmutable from 'swr/immutable';
import { ArrowLeft, ArrowRight, Minus, Plus, RefreshCcw01 } from '@untitledui/icons';
import { useRouter } from 'next/navigation';
import { NewProjectLayoutColumn } from '../../layout';
import { Favicon } from '@/app/(private)/components/Favicon';
import { Competitor } from '@/app/api/new-project/competitors/types';
import { appFetch, AppFetchError } from '@/hooks/appFetch';
import { isAiErrorCode } from '@/libs/ai/errors';
import { AiFailureState } from '@/app/components/AiFailureState';
import {
  isDuplicateName,
  isDuplicateUrl,
} from '@/app/(private)/project/[projectId]/settings/[tabId]/components/helpers';
import { isValidUrl } from '@/libs/utils/urls';
import { OnboardingProgressSteps } from '../components/OnboardingProgressSteps';

const THIS_STEP = NewProjectStep.Competitors;

const useCompetitors = (
  url: string | undefined,
  name: string | undefined,
  categories: string[],
  targetLocation: string | undefined,
  onSuccess: (competitors: Competitor[] | undefined) => void
) =>
  useSWRImmutable(
    url && name && categories.length
      ? ['competitors', url, name, categories, targetLocation]
      : null,
    async (): Promise<Competitor[] | undefined> => {
      if (!url || !name || !categories.length) return;
      if (url.length <= 4) throw new Error('Invalid URL');
      return appFetch<Competitor[]>(
        RouteHelper.Api.NewProject.getCompetitors(url, name, categories, targetLocation),
        undefined,
        'Failed to fetch competitors'
      );
    },
    { onSuccess }
  );

export default function CompetitorsForm() {
  const router = useRouter();
  const {
    getCorrectStep,
    brand,
    topics,
    competitors: competitorsContext,
    setCompetitors: setCompetitorsContext,
  } = useNewProjectContext();

  const [shouldFetchCompetitors, setShouldFetchCompetitors] = useState(!competitorsContext?.length);
  const [competitors, setCompetitors] = useState<Competitor[]>(competitorsContext);
  const [customUrl, setCustomUrl] = useState('');
  const [customUrlDebounced, { isPending: isDebouncePending }] = useDebounce(customUrl, 500);
  const [customName, setCustomName] = useState('');
  const [customIconUrl, setCustomIconUrl] = useState('');
  const [isUpdating, startTransition] = useTransition();

  const { data: metadata, isLoading: isLoadingDomainMetadata } =
    useDomainMetadata(customUrlDebounced);

  useEffect(() => {
    if (!metadata) return;
    setCustomName(metadata.name ?? '');
    setCustomIconUrl(metadata.iconUrl ?? '');
  }, [metadata?.url]);

  const {
    isLoading: isCompetitorsLoading,
    isValidating: isCompetitorsValidating,
    error: competitorsError,
    mutate: mutateCompetitors,
  } = useCompetitors(
    shouldFetchCompetitors ? brand?.url : undefined,
    brand?.name,
    topics?.selected ?? [],
    brand?.targetLocation,
    (competitors) => {
      setCompetitors(competitors ?? []);
      setCompetitorsContext(competitors ?? []);
    }
  );

  useEffect(() => {
    const correctStep = getCorrectStep();
    if (correctStep < THIS_STEP) router.push(routeForStep(correctStep));
  }, []);

  const setCompetitorName = (index: number, name: string) => {
    const newCompetitors = [...competitors];
    newCompetitors[index].name = name;
    setCompetitors(newCompetitors);
  };

  const onRemoveCompetitor = (index: number) => {
    const newCompetitors = [...competitors];
    newCompetitors.splice(index, 1);
    setCompetitors(newCompetitors);
  };

  const onAddCustom = () => {
    if (
      !customUrlDebounced.length ||
      isDebouncePending() ||
      !isValidUrl(customUrlDebounced) ||
      isDuplicateUrl(customUrlDebounced, competitors) ||
      isDuplicateName(customName, competitors)
    ) {
      return;
    }

    setCompetitors([
      ...competitors,
      {
        url: customUrlDebounced,
        name: customName || undefined,
        iconUrl: customIconUrl || undefined,
      },
    ]);
    setCustomUrl('');
    setCustomName('');
    setCustomIconUrl('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    onAddCustom();
  };

  const onReload = () => {
    setShouldFetchCompetitors(true);
    mutateCompetitors();
  };

  const onContinue = () =>
    startTransition(() => {
      setCompetitorsContext(competitors);
      router.push(ROUTES.NEW_PROJECT.SAVE);
    });

  const isUrlInvalid = !!customUrlDebounced.length && !isValidUrl(customUrlDebounced);
  const isUrlDuplicate =
    !!customUrlDebounced.length && isDuplicateUrl(customUrlDebounced, competitors ?? []);
  const isNameInvalid = !!customName.length && isDuplicateName(customName, competitors ?? []);

  const error =
    competitorsError?.message ||
    (isUrlInvalid && 'Invalid URL') ||
    (isUrlDuplicate && 'URL already used') ||
    (isNameInvalid && 'Name already used') ||
    undefined;
  // Onboarding's competitor suggestion call runs on Gemini — the provider is fixed, not something
  // the response carries back to the client.
  const competitorsAiErrorCode =
    competitorsError instanceof AppFetchError && isAiErrorCode(competitorsError.code)
      ? competitorsError.code
      : undefined;

  const canAdd =
    !!customUrlDebounced.length &&
    !isUrlInvalid &&
    !isUrlDuplicate &&
    !isDebouncePending() &&
    !isNameInvalid;

  const canContinue = !!competitors.length && !competitorsError;
  const isLoading = isCompetitorsLoading || isCompetitorsValidating;

  return (
    <NewProjectLayoutColumn>
      <div className="flex flex-col gap-5">
        <FormHeader
          title="Competitors Review"
          description="The competitors you want to monitor and benchmark against."
        />

        <div className="flex flex-col gap-2">
          {competitors.map((competitor, index) => (
            <div key={competitor.url} className="flex flex-row gap-2">
              <InputGroup
                value={competitor.url}
                size="md"
                isDisabled
                trailingAddon={
                  competitor.iconUrl ? (
                    <InputGroup.Prefix>
                      <Favicon url={competitor.iconUrl} alt={competitor.name} className="size-6" />
                    </InputGroup.Prefix>
                  ) : null
                }
                className="flex-1 border-r-0"
              >
                <InputBase type="url" placeholder="https://brand.com" />
              </InputGroup>

              <Input
                value={competitor.name}
                onChange={(value) => setCompetitorName(index, value)}
                isDisabled={isLoading}
                type="text"
                placeholder="Name"
                size="md"
                className="flex-1"
              />

              <Button
                color="secondary"
                size="md"
                className="h-auto shrink-0"
                onClick={() => onRemoveCompetitor(index)}
                isDisabled={isLoading}
              >
                <Minus size={14} />
              </Button>
            </div>
          ))}

          {!isCompetitorsLoading && (
            <>
              <div className="mt-4 -mb-1 ml-1 flex text-sm">New competitor</div>
              <div className="flex flex-row gap-2">
                <InputGroup
                  value={customUrl}
                  onChange={setCustomUrl}
                  isDisabled={isLoading}
                  isInvalid={isUrlInvalid}
                  isRequired
                  name="competitorUrl"
                  size="md"
                  trailingAddon={
                    isLoadingDomainMetadata ? (
                      <InputGroup.Prefix>
                        <LoadingIndicator size="xxs" />
                      </InputGroup.Prefix>
                    ) : customIconUrl ? (
                      <InputGroup.Prefix>
                        <Favicon url={customIconUrl} alt={customName} className="size-6" />
                      </InputGroup.Prefix>
                    ) : null
                  }
                  className="flex-1 border-r-0"
                >
                  <InputBase
                    type="url"
                    placeholder="https://competitor.com"
                    onKeyDown={handleKeyDown}
                  />
                </InputGroup>

                <Input
                  value={customName}
                  onChange={setCustomName}
                  onKeyDown={handleKeyDown}
                  isDisabled={isLoading}
                  isInvalid={isNameInvalid}
                  type="text"
                  name="competitorName"
                  placeholder="Name"
                  size="md"
                  className="flex-1"
                />

                <Button
                  color="secondary"
                  size="md"
                  className="h-auto shrink-0"
                  onClick={onAddCustom}
                  isDisabled={!canAdd || isLoading}
                >
                  <Plus size={14} />
                </Button>
              </div>
            </>
          )}
        </div>

        {competitorsAiErrorCode ? (
          <AiFailureState code={competitorsAiErrorCode} provider="google" variant="compact" />
        ) : (
          error && <div className="text-error-800 -mt-4 ml-0.5 text-xs">{error}</div>
        )}

        <div className="mt-10 flex gap-2">
          <Button
            type="button"
            color="secondary"
            size="lg"
            onClick={() => router.back()}
            iconLeading={ArrowLeft}
          >
            Back
          </Button>
          <Button
            type="button"
            color={error ? 'primary' : 'secondary'}
            size="lg"
            isDisabled={isUpdating || isLoading}
            isLoading={isLoading}
            onClick={onReload}
            iconLeading={RefreshCcw01}
          >
            Retry
          </Button>
          <Button
            type="button"
            size="lg"
            isDisabled={!canContinue || isUpdating || isLoading}
            isLoading={isUpdating}
            onClick={onContinue}
            className="flex-1"
            iconTrailing={ArrowRight}
          >
            Finish
          </Button>
        </div>

        <OnboardingProgressSteps currentStep={3} className="mt-5" />
      </div>
    </NewProjectLayoutColumn>
  );
}
