import { SlideoutMenu, SlideoutMenuProps } from '@/app/(private)/components/SlideoutMenu';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { PromptRow } from '@/libs/database/Prompts/types';
import { TopicRow } from '@/libs/database/Topics/types';
import { isPromptUnique } from '@/libs/utils/prompts';
import { Pencil } from 'lucide-react';
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
  const isNewCustomPromptUnique = nameHasChanged
    ? isPromptUnique(existingPrompts, editedName)
    : true;
  const canUpdatePrompt =
    !!editedName.length && !isUpdatingPrompt && isNewCustomPromptUnique && hasChanged;

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
      icon={<Pencil />}
      closeTitle="Done"
      content={
        <section className="mt-3 flex flex-col gap-4">
          {topics.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Topic</FieldLabel>
              <Select
                value={editedTopicId ?? null}
                onValueChange={(value) => setEditedTopicId(value ?? undefined)}
              >
                <SelectTrigger className="w-full">
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

          <div className="flex flex-col gap-1">
            <InputGroup>
              <InputGroupInput
                value={editedName}
                onChange={(event) => setEditedName(event.target.value)}
                name="promptName"
                type="text"
                placeholder="Prompt text"
                onKeyDown={handleKeyDown}
              />
              <InputGroupAddon align="inline-end" className="pr-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onUpdate}
                  disabled={!canUpdatePrompt}
                >
                  {isUpdatingPrompt ? <Spinner /> : 'Update'}
                </Button>
              </InputGroupAddon>
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
