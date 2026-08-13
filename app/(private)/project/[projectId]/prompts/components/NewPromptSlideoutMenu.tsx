'use client';

import { SlideoutMenu, SlideoutMenuProps } from '@/app/(private)/components/SlideoutMenu';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { TopicRow } from '@/libs/database/Topics/types';
import { PromptRow } from '@/libs/database/Prompts/types';
import { Topic, Topics } from '@/libs/ai/promptsIdeas/getPromptsIdeas';
import { isPromptUnique } from '@/libs/utils/prompts';
import { CUSTOM_TOPIC_NAME } from '@/libs/database/Topics/types';
import { TopicsSlideoutMenu } from './TopicsSlideoutMenu';
import { Plus, RefreshCw } from 'lucide-react';
import { useState, useEffect, useMemo, useTransition } from 'react';
import useSWRImmutable from 'swr/immutable';

export const NewPromptSlideoutMenu = ({
  isOpen,
  setIsOpen,
  existingPrompts,
  projectId,
  topics,
  project,
  onSuccess,
  onTopicAdded,
  onTopicUpdated,
  onTopicArchived,
  onTopicUnarchived,
}: SlideoutMenuProps & {
  existingPrompts: string[];
  projectId: string;
  topics: TopicRow[];
  project: { url: string; name: string; target_location: string | null };
  onSuccess: (prompts: PromptRow[]) => void;
  onTopicAdded: (topic: TopicRow) => void;
  onTopicUpdated: (topicId: string, topic: TopicRow) => void;
  onTopicArchived: (topicId: string) => void;
  onTopicUnarchived: (topic: TopicRow) => void;
}) => {
  const customTopicId = useMemo(
    () => topics.find((t) => t.name === CUSTOM_TOPIC_NAME)?.id,
    [topics]
  );

  // Single add state
  const [newCustomPrompt, setNewCustomPrompt] = useState('');
  const [singleTopicId, setSingleTopicId] = useState<string | undefined>(customTopicId);
  const [isAddingPrompt, startAddingPromptTransition] = useTransition();

  // Bulk import state
  const [bulkText, setBulkText] = useState('');
  const [bulkTopicId, setBulkTopicId] = useState<string | undefined>(customTopicId);
  const [isAddingBulk, startAddingBulkTransition] = useTransition();

  // Reset topic selections to Custom when the menu opens
  useEffect(() => {
    if (isOpen) {
      setSingleTopicId(customTopicId);
      setBulkTopicId(customTopicId);
    }
  }, [isOpen, customTopicId]);

  // Topics slideout state
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);

  // Suggested state
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [selectedSuggestedPrompts, setSelectedSuggestedPrompts] = useState<string[]>([]);
  const [isAddingSuggested, startAddingSuggestedTransition] = useTransition();

  const isNewCustomPromptUnique = isPromptUnique(existingPrompts, newCustomPrompt);
  const canAddNewCustomPrompt =
    !!newCustomPrompt.length && !isAddingPrompt && isNewCustomPromptUnique;

  const {
    data: suggestedTopics,
    isLoading: isSuggestionsLoading,
    isValidating: isSuggestionsValidating,
    error: suggestionsError,
    mutate: mutateSuggestions,
  } = useSWRImmutable<Topics>(
    activeTab === 'suggested' && project.url && project.name
      ? [projectId, 'suggestions', project.url, project.name, topics.map((t) => t.name)]
      : null,
    async () => {
      return appFetch<Topics>(
        RouteHelper.Api.NewProject.getPromptIdeas(
          project.url,
          project.name,
          topics.map((t) => t.name),
          project.target_location ?? undefined
        ),
        undefined,
        'Failed to fetch prompt suggestions'
      );
    }
  );

  const postPrompts = async (names: string[], topicId?: string): Promise<PromptRow[]> => {
    return appFetch<PromptRow[]>(
      RouteHelper.Api.Project.getPrompts(projectId),
      {
        method: 'POST',
        body: JSON.stringify({ names, topicId }),
      },
      'Failed to add prompts'
    );
  };

  const onAddSingle = () => {
    if (!canAddNewCustomPrompt) return;
    startAddingPromptTransition(async () => {
      try {
        const prompts = await postPrompts([newCustomPrompt], singleTopicId);
        setNewCustomPrompt('');
        showSuccessAlertToast('Prompt added', 'The new prompt has been added');
        onSuccess(prompts);
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onBulkAdd = () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    startAddingBulkTransition(async () => {
      try {
        const prompts = await postPrompts(lines, bulkTopicId);
        setBulkText('');
        showSuccessAlertToast(
          'Prompts added',
          `${prompts.length} prompt${prompts.length !== 1 ? 's' : ''} added`
        );
        onSuccess(prompts);
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onAddSuggested = () => {
    if (!selectedSuggestedPrompts.length) return;
    startAddingSuggestedTransition(async () => {
      try {
        const prompts = await postPrompts(selectedSuggestedPrompts);
        setSelectedSuggestedPrompts([]);
        showSuccessAlertToast(
          'Prompts added',
          `${prompts.length} prompt${prompts.length !== 1 ? 's' : ''} added`
        );
        onSuccess(prompts);
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const handleSingleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddSingle();
    }
  };

  const toggleSuggestedPrompt = (topicPrompts: string[], topicName: string) => {
    setSelectedSuggestedPrompts((prev) => {
      const withoutTopic = prev.filter(
        (p) => !suggestedTopics?.find((t) => t.topic === topicName)?.prompts.includes(p)
      );
      return [...withoutTopic, ...topicPrompts];
    });
  };

  const bulkLines = bulkText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

  const topicSelectItems = topics.map((topic) => ({ value: topic.id, label: topic.name }));

  return (
    <>
      <SlideoutMenu
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="Add new prompt"
        description="New prompt to monitor for your brand."
        icon={<Plus />}
        closeTitle="Done"
        footerAction={
          activeTab === 'suggested' && selectedSuggestedPrompts.length > 0
            ? onAddSuggested
            : undefined
        }
        footerActionLabel={
          activeTab === 'suggested' && selectedSuggestedPrompts.length > 0
            ? `Add ${selectedSuggestedPrompts.length} selected`
            : undefined
        }
        footerActionLoading={isAddingSuggested}
        content={
          <Tabs defaultValue="manual" onValueChange={setActiveTab}>
            <TabsList variant="line">
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="suggested">Suggested</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="flex flex-col gap-4 pt-4">
              <p className="text-secondary text-sm">Add a new prompt text.</p>

              {topics.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <FieldLabel>Topic</FieldLabel>
                    <button
                      type="button"
                      className="text-brand-600 hover:text-brand-700 cursor-pointer text-sm font-medium"
                      onClick={() => setIsTopicsOpen(true)}
                    >
                      (New)
                    </button>
                  </div>
                  <Select
                    items={topicSelectItems}
                    value={singleTopicId ?? null}
                    onValueChange={(value) => setSingleTopicId(value ?? undefined)}
                  >
                    <SelectTrigger aria-label="Topic" className="w-full">
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <section className="flex flex-col gap-1">
                <InputGroup>
                  <InputGroupInput
                    value={newCustomPrompt}
                    onChange={(event) => setNewCustomPrompt(event.target.value)}
                    name="customPrompt"
                    type="text"
                    placeholder="New prompt text"
                    onKeyDown={handleSingleKeyDown}
                  />
                  <InputGroupAddon align="inline-end" className="pr-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onAddSingle}
                      disabled={!canAddNewCustomPrompt}
                    >
                      {isAddingPrompt ? (
                        <>
                          <Spinner aria-hidden="true" />
                          <span className="sr-only">Add</span>
                        </>
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>

                {!isNewCustomPromptUnique && (
                  <div className="text-error-800 ml-0.5 text-xs">Prompt already exists</div>
                )}
              </section>

              <div className="border-secondary mt-8 border-t pt-6">
                <h3 className="text-primary mb-1 text-sm font-semibold">Bulk Import</h3>
                <p className="text-secondary mb-3 text-sm">Add one prompt per line.</p>

                {topics.length > 0 && (
                  <div className="mb-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <FieldLabel>Topic</FieldLabel>
                      <button
                        type="button"
                        className="text-brand-600 hover:text-brand-700 cursor-pointer text-sm font-medium"
                        onClick={() => setIsTopicsOpen(true)}
                      >
                        (New)
                      </button>
                    </div>
                    <Select
                      items={topicSelectItems}
                      value={bulkTopicId ?? null}
                      onValueChange={(value) => setBulkTopicId(value ?? undefined)}
                    >
                      <SelectTrigger aria-label="Topic" className="w-full">
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={
                    'What are the best [product] for [event]?\nTop rated [product] in [location]?\nHow to choose [product] for [use case]?'
                  }
                  className="min-h-40"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkAdd}
                  disabled={!bulkLines || isAddingBulk}
                  className="mt-2"
                >
                  {isAddingBulk ? (
                    <Spinner />
                  ) : (
                    `Add ${bulkLines || ''} prompt${bulkLines !== 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="suggested" className="flex flex-col gap-4 pt-4">
              {isSuggestionsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Spinner className="size-5" />
                </div>
              )}

              {suggestionsError && (
                <div className="text-error-800 text-sm">{suggestionsError.message}</div>
              )}

              {!isSuggestionsLoading && suggestedTopics && (
                <>
                  <p className="text-secondary text-sm">Select prompts to add to your project.</p>

                  {suggestedTopics.map((topicGroup: Topic) => (
                    <div key={topicGroup.topic}>
                      <div className="text-primary mb-1 text-sm font-semibold">
                        {topicGroup.topic}
                      </div>
                      <div
                        role="group"
                        aria-label={`${topicGroup.topic} prompts`}
                        className="flex flex-col gap-2"
                      >
                        {topicGroup.prompts.map((prompt) => {
                          const id = `suggested-prompt-${encodeURIComponent(prompt)}`;
                          return (
                            <Field
                              key={prompt}
                              orientation="horizontal"
                              className="border-border has-data-checked:border-shadcn-primary has-data-checked:bg-shadcn-primary/5 rounded-lg border p-3"
                            >
                              <Checkbox
                                id={id}
                                checked={selectedSuggestedPrompts.includes(prompt)}
                                onCheckedChange={(checked) =>
                                  toggleSuggestedPrompt(
                                    topicGroup.prompts.filter((candidate) =>
                                      candidate === prompt
                                        ? checked
                                        : selectedSuggestedPrompts.includes(candidate)
                                    ),
                                    topicGroup.topic
                                  )
                                }
                              />
                              <FieldLabel htmlFor={id} className="cursor-pointer text-sm font-normal">
                                {prompt}
                              </FieldLabel>
                            </Field>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => mutateSuggestions()}
                      disabled={isSuggestionsLoading || isSuggestionsValidating}
                    >
                      {isSuggestionsValidating ? <Spinner /> : <RefreshCw aria-hidden="true" />}{' '}
                      Retry
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={onAddSuggested}
                      disabled={!selectedSuggestedPrompts.length || isAddingSuggested}
                    >
                      {isAddingSuggested ? (
                        <Spinner />
                      ) : (
                        `Add ${selectedSuggestedPrompts.length || ''} selected`
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        }
      />
      <TopicsSlideoutMenu
        isOpen={isTopicsOpen}
        setIsOpen={setIsTopicsOpen}
        projectId={projectId}
        topics={topics}
        project={project}
        onTopicAdded={onTopicAdded}
        onTopicUpdated={onTopicUpdated}
        onTopicArchived={onTopicArchived}
        onTopicUnarchived={onTopicUnarchived}
      />
    </>
  );
};
