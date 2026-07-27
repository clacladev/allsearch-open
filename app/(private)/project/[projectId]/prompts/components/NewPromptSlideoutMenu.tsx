'use client';

import { SlideoutMenu, SlideoutMenuProps } from '@/app/(private)/components/SlideoutMenu';
import { showErrorAlertToast, showSuccessAlertToast } from '@/app/(public)/components/Alerts';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { Tabs, TabList, Tab, TabPanel } from '@/components/application/tabs/tabs';
import { Button } from '@/components/base/buttons/button';
import { CheckboxGroup } from '@/components/base/checkbox/checkbox-group';
import { InputBase } from '@/components/base/input/input';
import { InputGroup } from '@/components/base/input/input-group';
import { Select, SelectItemType } from '@/components/base/select/select';
import { SelectItem } from '@/components/base/select/select-item';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { TopicRow } from '@/libs/database/Topics/types';
import { PromptRow } from '@/libs/database/Prompts/types';
import { Topic, Topics } from '@/libs/ai/promptsIdeas/getPromptsIdeas';
import { isPromptUnique } from '@/libs/utils/prompts';
import { CUSTOM_TOPIC_NAME } from '@/libs/database/Topics/types';
import { Label } from '@/components/base/input/label';
import { TopicsSlideoutMenu } from './TopicsSlideoutMenu';
import { Plus, RefreshCcw01 } from '@untitledui/icons';
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

  const topicSelectItems: SelectItemType[] = topics.map((t) => ({ id: t.id, label: t.name }));

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
        <Tabs defaultSelectedKey="manual" onSelectionChange={(key) => setActiveTab(key as string)}>
          <TabList
            type="underline"
            items={[
              { id: 'manual', label: 'Manual' },
              { id: 'suggested', label: 'Suggested' },
            ]}
          >
            {(item) => <Tab id={item.id} label={item.label} />}
          </TabList>

          <TabPanel id="manual" className="flex flex-col gap-4 pt-4">
            <p className="text-secondary text-sm">Add a new prompt text.</p>

            {topicSelectItems.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Topic</Label>
                  <button
                    type="button"
                    className="cursor-pointer text-sm font-medium text-brand-600 hover:text-brand-700"
                    onClick={() => setIsTopicsOpen(true)}
                  >
                    (New)
                  </button>
                </div>
                <Select
                  items={topicSelectItems}
                  selectedKey={singleTopicId ?? null}
                  onSelectionChange={(key) => setSingleTopicId(key as string)}
                  placeholder="Select topic"
                  size="sm"
                >
                  {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                </Select>
              </div>
            )}

            <section className="flex flex-col gap-1">
              <InputGroup
                value={newCustomPrompt}
                onChange={setNewCustomPrompt}
                name="customPrompt"
                size="md"
                trailingAddon={
                  <Button
                    color="secondary"
                    size="md"
                    onClick={onAddSingle}
                    isDisabled={!canAddNewCustomPrompt}
                  >
                    {isAddingPrompt ? <LoadingIndicator size="xs" /> : 'Add'}
                  </Button>
                }
              >
                <InputBase
                  type="text"
                  placeholder="New prompt text"
                  onKeyDown={handleSingleKeyDown}
                />
              </InputGroup>

              {!isNewCustomPromptUnique && (
                <div className="text-error-800 ml-0.5 text-xs">Prompt already exists</div>
              )}
            </section>

            <div className="border-secondary mt-8 border-t pt-6">
              <h3 className="text-primary mb-1 text-sm font-semibold">Bulk Import</h3>
              <p className="text-secondary mb-3 text-sm">Add one prompt per line.</p>

              {topicSelectItems.length > 0 && (
                <div className="mb-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label>Topic</Label>
                    <button
                      type="button"
                      className="cursor-pointer text-sm font-medium text-brand-600 hover:text-brand-700"
                      onClick={() => setIsTopicsOpen(true)}
                    >
                      (New)
                    </button>
                  </div>
                  <Select
                    items={topicSelectItems}
                    selectedKey={bulkTopicId ?? null}
                    onSelectionChange={(key) => setBulkTopicId(key as string)}
                    placeholder="Select topic"
                    size="sm"
                  >
                    {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                  </Select>
                </div>
              )}

              <textarea
                rows={8}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={
                  'What are the best [product] for [event]?\nTop rated [product] in [location]?\nHow to choose [product] for [use case]?'
                }
                className="ring-primary focus:ring-brand bg-primary text-primary w-full rounded-lg px-3.5 py-2.5 text-sm shadow-xs ring-1 outline-hidden ring-inset focus:ring-2"
              />

              <Button
                color="secondary"
                size="sm"
                onClick={onBulkAdd}
                isDisabled={!bulkLines || isAddingBulk}
                className="mt-2"
              >
                {isAddingBulk ? (
                  <LoadingIndicator size="xs" />
                ) : (
                  `Add ${bulkLines || ''} prompt${bulkLines !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </TabPanel>

          <TabPanel id="suggested" className="flex flex-col gap-4 pt-4">
            {isSuggestionsLoading && (
              <div className="flex items-center justify-center py-8">
                <LoadingIndicator size="sm" />
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
                    <CheckboxGroup
                      aria-label={`${topicGroup.topic} prompts`}
                      items={topicGroup.prompts.map((prompt) => ({
                        title: prompt,
                        value: prompt,
                      }))}
                      value={selectedSuggestedPrompts.filter((p) => topicGroup.prompts.includes(p))}
                      onChange={(selected) =>
                        toggleSuggestedPrompt(selected as string[], topicGroup.topic)
                      }
                    />
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button
                    color="secondary"
                    size="sm"
                    onClick={() => mutateSuggestions()}
                    isDisabled={isSuggestionsLoading || isSuggestionsValidating}
                    isLoading={isSuggestionsValidating}
                    iconLeading={RefreshCcw01}
                  >
                    Retry
                  </Button>

                  <Button
                    color="primary"
                    size="sm"
                    onClick={onAddSuggested}
                    isDisabled={!selectedSuggestedPrompts.length || isAddingSuggested}
                  >
                    {isAddingSuggested ? (
                      <LoadingIndicator size="xs" />
                    ) : (
                      `Add ${selectedSuggestedPrompts.length || ''} selected`
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabPanel>
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
