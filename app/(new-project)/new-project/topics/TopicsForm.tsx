'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import FormHeader from '../components/FormHeader';
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
import { useRouter } from 'next/navigation';
import { NewProjectLayoutColumn } from '../../layout';
import { appFetch, AppFetchError } from '@/hooks/appFetch';
import { isAiErrorCode } from '@/libs/ai/errors';
import { AiFailureState } from '@/app/components/AiFailureState';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
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
            <div role="group" aria-label="Topics" className="flex flex-col gap-2">
              {topicsItems.map((item) => (
                <label key={item.value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedTopics.includes(item.value)}
                    onCheckedChange={(checked) =>
                      setSelectedTopics((current) =>
                        checked
                          ? [...current, item.value]
                          : current.filter((topic) => topic !== item.value)
                      )
                    }
                    disabled={isLoading}
                  />
                  {item.title}
                </label>
              ))}
            </div>

            <InputGroup>
              <InputGroupInput
                value={newCustomTopic}
                onChange={(event) => setNewCustomTopic(event.target.value)}
                disabled={isLoading || !canAddNewCustom}
                name="customTopic"
                type="text"
                placeholder="Custom"
                onKeyDown={handleKeyDown}
              />
              <InputGroupAddon align="inline-end" className="pr-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddCustom}
                  disabled={!newCustomTopic.length || isLoading || !canAddNewCustom}
                >
                  Add
                </Button>
              </InputGroupAddon>
            </InputGroup>

            {!canAddNewCustom && (
              <div className="text-error-800 -mt-4 ml-0.5 text-xs">
                <span>You can only add {MAX_CUSTOM_TOPICS} custom topics.</span>{' '}
                <Button
                  type="button"
                  variant="link"
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
          <AiFailureState
            code={topicsIdeasAiErrorCode}
            provider="google"
            variant="compact"
            fixDestination="keys"
          />
        ) : (
          topicsIdeasError && (
            <div className="text-error-800 ml-0.5 text-xs">{topicsIdeasError?.message}</div>
          )
        )}

        <div className="mt-10 flex gap-2">
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            <ArrowLeft aria-hidden="true" /> Back
          </Button>
          <Button
            type="button"
            variant={topicsIdeasError ? 'default' : 'outline'}
            size="lg"
            disabled={isUpdating || isLoading}
            onClick={onReload}
          >
            <RefreshCw aria-hidden="true" /> Retry {isLoading && <Spinner aria-hidden="true" />}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!canContinue || isUpdating || isLoading}
            onClick={onContinue}
            className="flex-1"
          >
            Continue <ArrowRight aria-hidden="true" />{' '}
            {isUpdating && <Spinner aria-hidden="true" />}
          </Button>
        </div>

        <OnboardingProgressSteps currentStep={1} className="mt-5" />
      </div>
    </NewProjectLayoutColumn>
  );
}
