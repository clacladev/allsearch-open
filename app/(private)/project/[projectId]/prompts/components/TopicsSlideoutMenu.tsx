'use client';

import { SlideoutMenu, SlideoutMenuProps } from '@/app/(private)/components/SlideoutMenu';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { TopicRow, CUSTOM_TOPIC_NAME } from '@/libs/database/Topics/types';
import { TopicsNames } from '@/libs/ai/topicsIdeas/getTopicsIdeas';
import { Check, ChevronDown, Minus, Plus, RefreshCw } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import useSWRImmutable from 'swr/immutable';

export const TopicsSlideoutMenu = ({
  isOpen,
  setIsOpen,
  projectId,
  topics,
  project,
  onTopicAdded,
  onTopicUpdated,
  onTopicArchived,
  onTopicUnarchived,
}: SlideoutMenuProps & {
  projectId: string;
  topics: TopicRow[];
  project: { url: string; name: string; target_location: string | null };
  onTopicAdded: (topic: TopicRow) => void;
  onTopicUpdated: (topicId: string, topic: TopicRow) => void;
  onTopicArchived: (topicId: string) => void;
  onTopicUnarchived: (topic: TopicRow) => void;
}) => {
  const [activeTab, setActiveTab] = useState<string>('edit');

  // Edit tab state
  const [newTopicName, setNewTopicName] = useState('');
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [savedTopicId, setSavedTopicId] = useState<string>();
  const [removingTopicId, setRemovingTopicId] = useState<string>();
  const [restoringTopicId, setRestoringTopicId] = useState<string>();
  const [shouldShowArchived, setShouldShowArchived] = useState(false);
  const [isAdding, startAddingTransition] = useTransition();
  const [isRemoving, startRemovingTransition] = useTransition();
  const [isRestoring, startRestoringTransition] = useTransition();

  // Suggested tab state
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isAddingSuggested, startAddingSuggestedTransition] = useTransition();

  const activeTopics = topics.filter((t) => !t.is_archived && t.name !== CUSTOM_TOPIC_NAME);
  const archivedTopics = topics.filter((t) => t.is_archived);

  const isDuplicateName = (name: string) =>
    topics.some((t) => t.name.toLowerCase() === name.trim().toLowerCase());

  const canAddNew = !!newTopicName.length && !isAdding && !isDuplicateName(newTopicName);

  // Fetch suggested topics only when on the suggested tab
  const {
    data: suggestedTopics,
    isLoading: isSuggestionsLoading,
    isValidating: isSuggestionsValidating,
    error: suggestionsError,
    mutate: mutateSuggestions,
  } = useSWRImmutable<TopicsNames>(
    activeTab === 'suggested' && project.url && project.name
      ? [projectId, 'topic-suggestions', project.url, project.name]
      : null,
    async () => {
      return appFetch<TopicsNames>(
        RouteHelper.Api.NewProject.getTopicsIdeas(project.url, project.name),
        undefined,
        'Failed to fetch topic suggestions'
      );
    }
  );

  // Filter out already-existing topics from suggestions
  const filteredSuggestions = suggestedTopics?.filter(
    (s) => !topics.some((t) => t.name.toLowerCase() === s.toLowerCase())
  );

  const debouncedSaveName = useDebouncedCallback(async (topicId: string, name: string) => {
    try {
      const updated = await appFetch<TopicRow>(
        RouteHelper.Api.Project.getTopics(projectId),
        {
          method: 'PATCH',
          body: JSON.stringify({ topicId, name }),
        },
        'Failed to update topic name'
      );
      onTopicUpdated(topicId, updated);
      setSavedTopicId(topicId);
      setTimeout(() => setSavedTopicId(undefined), 2000);
    } catch (error) {
      console.error(error);
      showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
    }
  }, 800);

  const onTopicNameChange = (topicId: string, name: string) => {
    setEditingNames((prev) => ({ ...prev, [topicId]: name }));
    debouncedSaveName(topicId, name);
  };

  const onArchive = (topicId: string) => {
    setRemovingTopicId(topicId);
    startRemovingTransition(async () => {
      try {
        await appFetch(
          RouteHelper.Api.Project.getTopics(projectId),
          {
            method: 'DELETE',
            body: JSON.stringify({ topicId }),
          },
          'Failed to archive topic'
        );
        onTopicArchived(topicId);
        showSuccessAlertToast('Topic archived', 'The topic has been archived');
        setRemovingTopicId(undefined);
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onUnarchive = (topicId: string) => {
    setRestoringTopicId(topicId);
    startRestoringTransition(async () => {
      try {
        const restored = await appFetch<TopicRow>(
          RouteHelper.Api.Project.getTopics(projectId),
          {
            method: 'PATCH',
            body: JSON.stringify({ topicId, unarchive: true }),
          },
          'Failed to restore topic'
        );
        onTopicUnarchived(restored);
        showSuccessAlertToast('Topic restored', 'The topic has been restored');
        setRestoringTopicId(undefined);
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onAddNew = () => {
    if (!canAddNew) return;
    startAddingTransition(async () => {
      try {
        const topic = await appFetch<TopicRow>(
          RouteHelper.Api.Project.getTopics(projectId),
          {
            method: 'POST',
            body: JSON.stringify({ name: newTopicName.trim() }),
          },
          'Failed to add topic'
        );
        onTopicAdded(topic);
        setNewTopicName('');
        showSuccessAlertToast('Topic added', 'The new topic has been added');
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onAddSuggested = () => {
    if (!selectedSuggestions.length) return;
    startAddingSuggestedTransition(async () => {
      const added: string[] = [];
      try {
        for (const name of selectedSuggestions) {
          const topic = await appFetch<TopicRow>(
            RouteHelper.Api.Project.getTopics(projectId),
            {
              method: 'POST',
              body: JSON.stringify({ name }),
            },
            'Failed to add topic'
          );
          onTopicAdded(topic);
          added.push(name);
        }
        showSuccessAlertToast(
          'Topics added',
          `${selectedSuggestions.length} topic${selectedSuggestions.length !== 1 ? 's' : ''} added`
        );
        setSelectedSuggestions([]);
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
        setSelectedSuggestions((prev) => prev.filter((s) => !added.includes(s)));
      }
    });
  };

  const handleNewTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddNew();
    }
  };

  return (
    <SlideoutMenu
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Manage topics"
      description="Organize your prompts into topics."
      icon={<Plus />}
      closeTitle="Done"
      footerAction={
        activeTab === 'suggested' && selectedSuggestions.length > 0 ? onAddSuggested : undefined
      }
      footerActionLabel={
        activeTab === 'suggested' && selectedSuggestions.length > 0
          ? `Add ${selectedSuggestions.length} selected`
          : undefined
      }
      footerActionLoading={isAddingSuggested}
      content={
        <Tabs defaultValue="edit" onValueChange={setActiveTab}>
          <TabsList variant="line">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="suggested">Suggested</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex flex-col gap-3 pt-4">
            <p className="text-secondary text-sm">Edit or remove existing topics.</p>

            <div className="flex flex-col gap-2">
              {activeTopics.map((topic) => (
                <div key={topic.id} className="flex flex-row gap-2">
                  <InputGroup className="flex-1">
                    <InputGroupInput
                      value={editingNames[topic.id] ?? topic.name}
                      onChange={(event) => onTopicNameChange(topic.id, event.target.value)}
                      type="text"
                      placeholder="Topic name"
                    />
                  </InputGroup>

                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="h-auto w-11 shrink-0"
                    onClick={() => onArchive(topic.id)}
                    disabled={
                      savedTopicId === topic.id || (isRemoving && removingTopicId === topic.id)
                    }
                  >
                    {savedTopicId === topic.id ? (
                      <Check size={14} className="text-success-600" />
                    ) : isRemoving && removingTopicId === topic.id ? (
                      <Spinner className="size-3" />
                    ) : (
                      <Minus size={14} />
                    )}
                  </Button>
                </div>
              ))}

              <div className="mt-4 -mb-1 ml-1 flex text-sm">New topic</div>
              <div className="flex flex-row gap-2">
                <InputGroup className="flex-1">
                  <InputGroupInput
                    value={newTopicName}
                    onChange={(event) => setNewTopicName(event.target.value)}
                    type="text"
                    placeholder="Topic name"
                    onKeyDown={handleNewTopicKeyDown}
                  />
                </InputGroup>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="h-auto shrink-0"
                  onClick={onAddNew}
                  disabled={!canAddNew || isAdding}
                >
                  {isAdding ? <Spinner className="size-3" /> : <Plus size={14} />}
                </Button>
              </div>

              {newTopicName.length > 0 && isDuplicateName(newTopicName) && (
                <div className="text-error-800 -mt-2 ml-0.5 text-xs">Topic already exists</div>
              )}
            </div>

            {!!archivedTopics.length && (
              <div className="mt-2 flex flex-col">
                <button
                  type="button"
                  onClick={() => setShouldShowArchived((prev) => !prev)}
                  className="text-tertiary hover:text-secondary flex cursor-pointer items-center gap-1.5 self-start text-sm transition-colors"
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${shouldShowArchived ? 'rotate-180' : ''}`}
                  />
                  Show archived topics ({archivedTopics.length})
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${shouldShowArchived ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-2 pt-3">
                      {archivedTopics.map((topic) => (
                        <div
                          key={topic.id}
                          className="flex flex-row gap-2 opacity-60 transition-opacity hover:opacity-100"
                        >
                          <InputGroup className="flex-1">
                            <InputGroupInput
                              value={topic.name}
                              disabled
                              type="text"
                              placeholder="Topic name"
                            />
                          </InputGroup>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="h-auto shrink-0"
                            onClick={() => onUnarchive(topic.id)}
                            disabled={isRestoring && restoringTopicId === topic.id}
                          >
                            {isRestoring && restoringTopicId === topic.id ? (
                              <Spinner className="size-3" />
                            ) : (
                              <Plus size={14} />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
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

            {!isSuggestionsLoading && filteredSuggestions && (
              <>
                <p className="text-secondary text-sm">Select topics to add to your project.</p>

                {filteredSuggestions.length === 0 ? (
                  <p className="text-tertiary text-sm">All suggested topics are already added.</p>
                ) : (
                  <div role="group" aria-label="Suggested topics" className="flex flex-col gap-2">
                    {filteredSuggestions.map((topic) => {
                      const id = `suggested-topic-${encodeURIComponent(topic)}`;
                      return (
                        <div key={topic} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            id={id}
                            checked={selectedSuggestions.includes(topic)}
                            onCheckedChange={(checked) =>
                              setSelectedSuggestions((current) =>
                                checked
                                  ? [...current, topic]
                                  : current.filter((item) => item !== topic)
                              )
                            }
                          />
                          <label htmlFor={id} className="cursor-pointer">
                            {topic}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mutateSuggestions()}
                    disabled={isSuggestionsLoading || isSuggestionsValidating}
                  >
                    {isSuggestionsValidating ? <Spinner /> : <RefreshCw aria-hidden="true" />} Retry
                  </Button>

                  {filteredSuggestions.length > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onAddSuggested}
                      disabled={!selectedSuggestions.length || isAddingSuggested}
                    >
                      {isAddingSuggested ? (
                        <Spinner />
                      ) : (
                        `Add ${selectedSuggestions.length || ''} selected`
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      }
    />
  );
};
