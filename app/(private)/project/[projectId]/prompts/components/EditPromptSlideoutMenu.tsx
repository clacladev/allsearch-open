import { SlideoutMenu, SlideoutMenuProps } from '@/app/(private)/components/SlideoutMenu';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { Button } from '@/components/base/buttons/button';
import { InputBase } from '@/components/base/input/input';
import { InputGroup } from '@/components/base/input/input-group';
import { Select, SelectItemType } from '@/components/base/select/select';
import { SelectItem } from '@/components/base/select/select-item';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { PromptRow } from '@/libs/database/Prompts/types';
import { TopicRow } from '@/libs/database/Topics/types';
import { isPromptUnique } from '@/libs/utils/prompts';
import { Edit01 } from '@untitledui/icons';
import { useEffect, useState, useTransition } from 'react';

export const EditPromptSlideoutMenu = ({
  isOpen,
  setIsOpen,
  existingPrompts,
  promptName,
  promptId,
  projectId,
  topics,
  currentTopicId,
  onSuccess,
}: SlideoutMenuProps & {
  existingPrompts: string[];
  promptName: string;
  promptId: string;
  projectId: string;
  topics: TopicRow[];
  currentTopicId: string | undefined;
  onSuccess: (prompt: PromptRow) => void;
}) => {
  const [editedName, setEditedName] = useState(promptName);
  const [editedTopicId, setEditedTopicId] = useState<string | undefined>(currentTopicId);
  const [hasEditedNameSuccessfully, setHasEditedNameSuccessfully] = useState(false);
  const [isUpdatingPrompt, startUpdatingPromptTransition] = useTransition();

  // Update state when the target prompt changes
  useEffect(() => {
    setEditedName(promptName);
    setEditedTopicId(currentTopicId);
    setHasEditedNameSuccessfully(false);
  }, [promptName, currentTopicId]);

  const nameHasChanged = editedName !== promptName;
  const topicHasChanged = editedTopicId !== currentTopicId;
  const hasChanged = nameHasChanged || topicHasChanged;
  // Only check uniqueness when the name has actually changed (otherwise the prompt's own name would fail)
  const isNewCustomPromptUnique = nameHasChanged ? isPromptUnique(existingPrompts, editedName) : true;
  const canUpdatePrompt =
    !!editedName.length && !isUpdatingPrompt && isNewCustomPromptUnique && hasChanged;

  const topicSelectItems: SelectItemType[] = topics.map((t) => ({ id: t.id, label: t.name }));

  const onUpdate = () => {
    if (!canUpdatePrompt) return;

    startUpdatingPromptTransition(async () => {
      try {
        const prompt = await appFetch<PromptRow>(
          RouteHelper.Api.Project.getPrompts(projectId),
          {
            method: 'PATCH',
            body: JSON.stringify({
              name: editedName,
              promptId,
              ...(editedTopicId !== currentTopicId ? { topicId: editedTopicId } : {}),
            }),
          },
          'Failed to update prompt'
        );

        showSuccessAlertToast('Prompt updated', 'The prompt has been updated');
        setHasEditedNameSuccessfully(true);
        onSuccess(prompt);
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onUpdate();
    }
  };

  return (
    <SlideoutMenu
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Edit prompt"
      description="Edit your existing prompt."
      icon={<Edit01 />}
      closeTitle="Done"
      content={
        <section className="flex flex-col gap-4 mt-3">
          {topicSelectItems.length > 0 && (
            <Select
              label="Topic"
              items={topicSelectItems}
              selectedKey={editedTopicId ?? null}
              onSelectionChange={(key) => setEditedTopicId(key as string)}
              placeholder="Select topic"
              size="sm"
            >
              {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
            </Select>
          )}

          <div className="flex flex-col gap-1">
            <InputGroup
              value={editedName}
              onChange={setEditedName}
              name="promptName"
              size="md"
              trailingAddon={
                <Button color="secondary" size="md" onClick={onUpdate} isDisabled={!canUpdatePrompt}>
                  {isUpdatingPrompt ? <LoadingIndicator size="xs" /> : 'Update'}
                </Button>
              }
            >
              <InputBase type="text" placeholder="Prompt text" onKeyDown={handleKeyDown} />
            </InputGroup>

            {nameHasChanged && !isNewCustomPromptUnique && !hasEditedNameSuccessfully && (
              <div className="text-error-800 ml-0.5 text-xs">Prompt already exists</div>
            )}
          </div>
        </section>
      }
    />
  );
};
