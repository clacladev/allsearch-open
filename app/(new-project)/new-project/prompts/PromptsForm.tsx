'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
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
import { Topic, Topics } from '@/libs/ai/promptsIdeas/getPromptsIdeas';
import { useRouter } from 'next/navigation';
import {
  getPartsFromPromptAndTopicId,
  getPromptAndTopicId,
  PromptAndTopicId,
} from '@/libs/utils/PromptAndTopicId';
import { NewProjectLayoutColumn } from '../../layout';
import { CUSTOM_TOPIC_NAME } from '@/libs/database/Topics/types';
import { appFetch, AppFetchError } from '@/hooks/appFetch';
import { isAiErrorCode } from '@/libs/ai/errors';
import { AiFailureState } from '@/app/components/AiFailureState';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { OnboardingProgressSteps } from '../components/OnboardingProgressSteps';

const THIS_STEP = NewProjectStep.Prompts;

const DEFAULT_PRESELECTED_PROMPTS_PER_TOPIC = 2;
const MAX_CUSTOM_PROMPTS = 5;

function isDuplicatePrompt(prompt: string, topics: Topics) {
  const lowercasePrompt = prompt.toLowerCase();
  return (
    topics.findIndex(
      (topicGroup) =>
        topicGroup.prompts.findIndex((prompt) => prompt.toLowerCase() === lowercasePrompt) !== -1
    ) !== -1
  );
}

const usePromptIdeas = (
  url: string | undefined,
  name: string | undefined,
  categories: string[],
  targetLocation: string | undefined,
  onSuccess: (ideas: Topics | undefined) => void
) =>
  useSWRImmutable(
    url && name && !!categories.length
      ? ['prompt-ideas', url, name, categories, targetLocation]
      : null,
    async (): Promise<Topics | undefined> => {
      if (!url || !name || !categories.length) return;
      if (url.length <= 4) throw new Error('Invalid URL');
      return appFetch<Topics>(
        RouteHelper.Api.NewProject.getPromptIdeas(url, name, categories, targetLocation),
        undefined,
        'Failed to fetch prompt ideas'
      );
    },
    { onSuccess }
  );

export default function PromptsForm() {
  const router = useRouter();
  const { getCorrectStep, brand, topics, prompts, setPrompts } = useNewProjectContext();

  const [shouldFetchPromptIdeas, setShouldFetchPromptIdeas] = useState(!prompts?.ideas.length);
  const [topicsIdeas, setTopicsIdeas] = useState<Topics>(prompts?.ideas ?? []);
  const [customTopic, setCustomTopic] = useState<Topic>(
    prompts?.custom ?? { topic: CUSTOM_TOPIC_NAME, prompts: [] }
  );
  const [selectedPromptAndTopicIds, setSelectedPromptAndTopicIds] = useState<PromptAndTopicId[]>(
    prompts?.selectedIds ?? []
  );
  const [newCustomPrompt, setNewCustomPrompt] = useState('');
  const [isUpdating, startTransition] = useTransition();

  const {
    isLoading: isPromptIdeasLoading,
    isValidating: isPromptIdeasValidating,
    error: promptIdeasError,
    mutate: mutatePromptIdeas,
  } = usePromptIdeas(
    shouldFetchPromptIdeas ? brand?.url : undefined,
    brand?.name,
    topics?.selected ?? [],
    brand?.targetLocation,
    (topicGroups) => {
      const ideas = topicGroups ?? [];
      setTopicsIdeas(ideas);
      const selectedIds = ideas.flatMap((topicGroup) =>
        topicGroup.prompts
          .slice(0, DEFAULT_PRESELECTED_PROMPTS_PER_TOPIC)
          .map((prompt) => getPromptAndTopicId(topicGroup.topic, prompt))
      );
      setSelectedPromptAndTopicIds(selectedIds);
      setPrompts({
        selectedIds,
        ideas: ideas,
        custom: customTopic,
      });
    }
  );

  useEffect(() => {
    const correctStep = getCorrectStep();
    if (correctStep < THIS_STEP) router.push(routeForStep(correctStep));
  }, []);

  const toggleSelectedPromptAndTopicIds = (ids: PromptAndTopicId[], topicId: string) => {
    const newSelected = [...selectedPromptAndTopicIds]
      .filter((id) => {
        const { topic: currentTopicId } = getPartsFromPromptAndTopicId(id);
        return currentTopicId !== topicId;
      })
      .concat(...ids);

    setSelectedPromptAndTopicIds(newSelected);
  };

  const onAddCustom = () => {
    if (!canAddNewCustom) return;
    if (
      isDuplicatePrompt(newCustomPrompt, topicsIdeas) ||
      isDuplicatePrompt(newCustomPrompt, [customTopic])
    ) {
      setNewCustomPrompt('');
      return;
    }

    customTopic.prompts.push(newCustomPrompt);
    setCustomTopic(customTopic);
    setSelectedPromptAndTopicIds([
      ...selectedPromptAndTopicIds,
      getPromptAndTopicId(CUSTOM_TOPIC_NAME, newCustomPrompt),
    ]);
    setNewCustomPrompt('');
  };

  const onResetCustomValues = () => {
    setCustomTopic({ topic: CUSTOM_TOPIC_NAME, prompts: [] });
    setSelectedPromptAndTopicIds(
      selectedPromptAndTopicIds.filter((id) => {
        const { topic } = getPartsFromPromptAndTopicId(id);
        return topic !== CUSTOM_TOPIC_NAME;
      })
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !!newCustomPrompt.length) {
      onAddCustom();
    }
  };

  const onReload = () => {
    setShouldFetchPromptIdeas(true);
    mutatePromptIdeas();
  };

  const onContinue = () =>
    startTransition(() => {
      setPrompts({
        selectedIds: selectedPromptAndTopicIds,
        ideas: topicsIdeas,
        custom: customTopic,
      });
      router.push(ROUTES.NEW_PROJECT.COMPETITORS);
    });

  const allTopics = [...topicsIdeas, customTopic];
  const canAddNewCustom = customTopic.prompts.length < MAX_CUSTOM_PROMPTS;
  const canContinue = !!selectedPromptAndTopicIds.length;
  const isLoading = isPromptIdeasLoading || isPromptIdeasValidating;
  // All three onboarding suggestion calls (topics/prompts/competitors) run on Gemini — the
  // provider is fixed, not something the response carries back to the client.
  const promptIdeasAiErrorCode =
    promptIdeasError instanceof AppFetchError && isAiErrorCode(promptIdeasError.code)
      ? promptIdeasError.code
      : undefined;

  return (
    <NewProjectLayoutColumn>
      <div className="flex flex-col gap-5">
        <FormHeader
          title="Suggested Prompts"
          description="Choose the prompts you want to monitor for your brand visibility."
        />

        {!isPromptIdeasLoading &&
          allTopics.map((topicGroup) => (
            <div key={topicGroup.topic}>
              <div className="mb-1 text-lg font-semibold">{topicGroup.topic}</div>

              <div
                role="group"
                aria-label={`${topicGroup.topic} Prompts`}
                className="flex flex-col gap-2"
              >
                {topicGroup.prompts.map((prompt) => {
                  const id = getPromptAndTopicId(topicGroup.topic, prompt);
                  const inputId = `prompt-${encodeURIComponent(id)}`;
                  return (
                    <Field
                      key={id}
                      orientation="horizontal"
                      className="border-border has-data-checked:border-shadcn-primary has-data-checked:bg-shadcn-primary/5 rounded-lg border p-3"
                    >
                      <Checkbox
                        id={inputId}
                        checked={selectedPromptAndTopicIds.includes(id)}
                        onCheckedChange={(checked) => {
                          const selected = selectedPromptAndTopicIds.filter((selectedId) => {
                            const { topic } = getPartsFromPromptAndTopicId(selectedId);
                            return topic === topicGroup.topic;
                          });
                          toggleSelectedPromptAndTopicIds(
                            checked
                              ? [...selected, id]
                              : selected.filter((selectedId) => selectedId !== id),
                            topicGroup.topic
                          );
                        }}
                        disabled={isLoading}
                      />
                      <FieldLabel htmlFor={inputId} className="cursor-pointer text-sm font-normal">
                        {prompt}
                      </FieldLabel>
                    </Field>
                  );
                })}
              </div>

              {topicGroup.topic === CUSTOM_TOPIC_NAME && (
                <InputGroup className="mt-3 h-11">
                  <InputGroupInput
                    value={newCustomPrompt}
                    onChange={(event) => setNewCustomPrompt(event.target.value)}
                    disabled={isLoading || !canAddNewCustom}
                    name="customPrompt"
                    type="text"
                    placeholder="Custom"
                    onKeyDown={handleKeyDown}
                    className="text-md h-full"
                  />
                  <InputGroupAddon align="inline-end" className="pr-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={onAddCustom}
                      disabled={!newCustomPrompt.length || isLoading || !canAddNewCustom}
                    >
                      Add
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              )}
            </div>
          ))}

        {!canAddNewCustom && (
          <div className="text-error-800 -mt-4 ml-0.5 text-xs">
            <span>You can only add {MAX_CUSTOM_PROMPTS} custom prompts.</span>{' '}
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={onResetCustomValues}
              className="text-error-800"
            >
              Reset custom prompts
            </Button>
          </div>
        )}
        {promptIdeasAiErrorCode ? (
          <AiFailureState
            code={promptIdeasAiErrorCode}
            provider="google"
            variant="compact"
            fixDestination="keys"
          />
        ) : (
          promptIdeasError && (
            <div className="text-error-800 ml-0.5 text-xs">{promptIdeasError?.message}</div>
          )
        )}

        <div className="mt-10 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11"
            onClick={() => router.back()}
          >
            <ArrowLeft aria-hidden="true" /> Back
          </Button>
          <Button
            type="button"
            variant={promptIdeasError ? 'default' : 'outline'}
            size="lg"
            className="h-11"
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
            className="h-11 flex-1"
          >
            Continue <ArrowRight aria-hidden="true" />{' '}
            {isUpdating && <Spinner aria-hidden="true" />}
          </Button>
        </div>

        <OnboardingProgressSteps currentStep={2} className="mt-5" />
      </div>
    </NewProjectLayoutColumn>
  );
}
