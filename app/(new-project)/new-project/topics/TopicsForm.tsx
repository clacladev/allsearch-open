'use client';

import { Button } from '@/components/base/buttons/button';
import FormHeader from '../components/FormHeader';
import { CheckboxGroup } from '@/components/base/checkbox/checkbox-group';
import {
  routeForStep,
  NewProjectStep,
  useNewProjectContext,
} from '../components/NewProjectContext';
import { useEffect, useState } from 'react';
import { useTransition } from 'react';
import { RouteHelper, ROUTES } from '@/libs/routes';
import useSWRImmutable from 'swr/immutable';
import { TopicsNames } from '@/libs/ai/topicsIdeas/getTopicsIdeas';
import { InputGroup } from '@/components/base/input/input-group';
import { InputBase } from '@/components/base/input/input';
import { useRouter } from 'next/navigation';
import { NewProjectLayoutColumn } from '../../layout';
import { appFetch, AppFetchError } from '@/hooks/appFetch';
import { isAiErrorCode } from '@/libs/ai/errors';
import { AiFailureState } from '@/app/components/AiFailureState';
import { ArrowLeft, ArrowRight, RefreshCcw01 } from '@untitledui/icons';
import { OnboardingProgressSteps } from '../components/OnboardingProgressSteps';

const THIS_STEP = NewProjectStep.Topics;

const DEFAULT_PRESELECTED_TOPICS = 2;
const MAX_CUSTOM_TOPICS = 3;

function isDuplicateItem(value: string, array: string[]) {
  const targetValue = value.toLowerCase();
  return array.findIndex((item) => item.toLowerCase() === targetValue) !== -1;
}

const useTopicsIdeas = (
  url: string | undefined,
  name: string | undefined,
  onSuccess: (ideas: TopicsNames | undefined) => void
) =>
  useSWRImmutable(
    url && name ? ['topics-ideas', url, name] : null,
    async (): Promise<TopicsNames | undefined> => {
      if (!url || !name) return;
      if (url.length <= 4) throw new Error('Invalid URL');
      return appFetch<TopicsNames>(
        RouteHelper.Api.NewProject.getTopicsIdeas(url, name),
        undefined,
        'Failed to fetch topics ideas'
      );
    },
    { onSuccess }
  );

export default function TopicsForm() {
  const router = useRouter();
  const { getCorrectStep, brand, topics, setTopics, setPrompts } = useNewProjectContext();

  const [shouldFetchTopicsIdeas, setShouldFetchTopicsIdeas] = useState(!topics?.ideas.length);
  const [topicsIdeas, setTopicsIdeas] = useState<TopicsNames>(topics?.ideas ?? []);
  const [customTopics, setCustomTopics] = useState<TopicsNames>(topics?.custom ?? []);
  const [selectedTopics, setSelectedTopics] = useState<TopicsNames>(topics?.selected ?? []);
  const [newCustomTopic, setNewCustomTopic] = useState('');
  const [isUpdating, startTransition] = useTransition();

  const topicsItems = [...topicsIdeas, ...customTopics].map((idea) => ({
    title: idea,
    value: idea,
  }));

  const {
    isLoading: isTopicsIdeasLoading,
    isValidating: isTopicsIdeasValidating,
    error: topicsIdeasError,
    mutate: mutateTopicsIdeas,
  } = useTopicsIdeas(shouldFetchTopicsIdeas ? brand?.url : undefined, brand?.name, (ideas) => {
    const selected = ideas?.slice(0, DEFAULT_PRESELECTED_TOPICS) ?? [];
    setTopicsIdeas(ideas ?? []);
    setSelectedTopics(selected);
    setTopics({ selected, ideas: ideas ?? [], custom: customTopics });
  });

  useEffect(() => {
    const correctStep = getCorrectStep();
    if (correctStep < THIS_STEP) router.push(routeForStep(correctStep));
  }, []);

  const onAddCustom = () => {
    if (!canAddNewCustom) return;
    if (
      isDuplicateItem(newCustomTopic, topicsIdeas) ||
      isDuplicateItem(newCustomTopic, customTopics)
    ) {
      setNewCustomTopic('');
      return;
    }

    setCustomTopics([...customTopics, newCustomTopic]);
    setSelectedTopics([...selectedTopics, newCustomTopic]);
    setNewCustomTopic('');
  };

  const onResetCustomValues = () => {
    setCustomTopics([]);
    const ideas = topics?.ideas ?? [];
    const selected = (topics?.selected ?? []).filter((selected) => ideas.includes(selected));
    setSelectedTopics(selected);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !!newCustomTopic.length) {
      onAddCustom();
    }
  };

  const onReload = () => {
    setShouldFetchTopicsIdeas(true);
    mutateTopicsIdeas();
  };

  const onContinue = () => {
    startTransition(() => {
      setTopics({
        selected: selectedTopics,
        ideas: topicsIdeas,
        custom: customTopics,
      });

      const hasSelectionChanged =
        JSON.stringify(selectedTopics) !== JSON.stringify(topics?.selected);
      if (hasSelectionChanged) setPrompts(undefined);

      router.push(ROUTES.NEW_PROJECT.PROMPTS);
    });
  };

  const canAddNewCustom = customTopics.length < MAX_CUSTOM_TOPICS;
  const canContinue = !!selectedTopics.length;
  const isLoading = isTopicsIdeasLoading || isTopicsIdeasValidating;
  // All three onboarding suggestion calls (topics/prompts/competitors) run on Gemini — the
  // provider is fixed, not something the response carries back to the client.
  const topicsIdeasAiErrorCode =
    topicsIdeasError instanceof AppFetchError && isAiErrorCode(topicsIdeasError.code)
      ? topicsIdeasError.code
      : undefined;

  return (
    <NewProjectLayoutColumn>
      <div className="flex flex-col gap-5">
        <FormHeader
          title="Suggested Topics"
          description="Choose the topics you want to track for your brand. We'll create prompts for these topics in the next step."
        />

        {!isTopicsIdeasLoading && (
          <>
            <CheckboxGroup
              aria-label="Topics"
              items={topicsItems}
              value={selectedTopics}
              onChange={setSelectedTopics}
              isDisabled={isLoading}
            />

            <InputGroup
              value={newCustomTopic}
              onChange={setNewCustomTopic}
              isDisabled={isLoading || !canAddNewCustom}
              name="customTopic"
              size="md"
              trailingAddon={
                <Button
                  color="secondary"
                  size="md"
                  onClick={onAddCustom}
                  isDisabled={!newCustomTopic.length || isLoading || !canAddNewCustom}
                >
                  Add
                </Button>
              }
            >
              <InputBase type="text" placeholder="Custom" onKeyDown={handleKeyDown} />
            </InputGroup>

            {!canAddNewCustom && (
              <div className="text-error-800 -mt-4 ml-0.5 text-xs">
                <span>You can only add {MAX_CUSTOM_TOPICS} custom topics.</span>{' '}
                <Button
                  type="button"
                  color="link-destructive"
                  size="xs"
                  onClick={onResetCustomValues}
                  className="text-error-800"
                >
                  Reset custom topics
                </Button>
              </div>
            )}
          </>
        )}

        {topicsIdeasAiErrorCode ? (
          <AiFailureState code={topicsIdeasAiErrorCode} provider="google" variant="compact" />
        ) : (
          topicsIdeasError && (
            <div className="text-error-800 ml-0.5 text-xs">{topicsIdeasError?.message}</div>
          )
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
            color={topicsIdeasError ? 'primary' : 'secondary'}
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
            Continue
          </Button>
        </div>

        <OnboardingProgressSteps currentStep={1} className="mt-5" />
      </div>
    </NewProjectLayoutColumn>
  );
}
