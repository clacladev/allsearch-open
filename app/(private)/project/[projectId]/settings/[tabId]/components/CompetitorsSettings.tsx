import { useDebounce, useDebouncedCallback } from 'use-debounce';
import { useEffect, useState } from 'react';
import { useTransition } from 'react';
import { useDomainMetadata } from '@/app/(new-project)/new-project/components/useDomainMetadata';
import { Form } from '@/components/base/form/form';
import { InputGroup } from '@/components/base/input/input-group';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { Favicon } from '@/app/(private)/components/Favicon';
import { Input, InputBase } from '@/components/base/input/input';
import { Button } from '@/components/base/buttons/button';
import SettingsFormHeader from '@/components/settings/SettingsFormHeader';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { RouteHelper } from '@/libs/routes';
import { Check, ChevronDown, Minus, Plus } from '@untitledui/icons';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { isDuplicateName, isDuplicateUrl } from './helpers';
import { appFetch } from '@/hooks/appFetch';
import { isValidUrl } from '@/libs/utils/urls';

export default function CompetitorsSettings() {
  const {
    currentProject,
    allCurrentCompetitors,
    archiveCompetitor,
    addCompetitor,
    updateCompetitor,
  } = usePrivateLayoutContext();
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [customUrlDebounced, { isPending: isDebouncePending }] = useDebounce(customUrl, 500);
  const [customName, setCustomName] = useState('');
  const [customIconUrl, setCustomIconUrl] = useState('');
  const [isAdding, startAddingTransition] = useTransition();
  const [isRemoving, startRemovingTransition] = useTransition();
  const [removingCompetitorId, setRemovingCompetitorId] = useState<string>();
  const [isRestoring, startRestoringTransition] = useTransition();
  const [restoringCompetitorId, setRestoringCompetitorId] = useState<string>();
  const [shouldShowArchived, setShouldShowArchived] = useState(false);
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [savedCompetitorId, setSavedCompetitorId] = useState<string>();

  const { data: metadata, isLoading: isLoadingDomainMetadata } =
    useDomainMetadata(customUrlDebounced);

  useEffect(() => {
    if (!metadata) return;
    setCustomName(metadata.name ?? '');
    setCustomIconUrl(metadata.iconUrl ?? '');
  }, [metadata?.url]);

  const debouncedSaveName = useDebouncedCallback(async (competitorId: string, name: string) => {
    if (!currentProject) return;
    try {
      const updated = await appFetch<CompetitorRow>(
        RouteHelper.Api.Project.getCompetitors(currentProject.id),
        {
          method: 'PATCH',
          body: JSON.stringify({ competitorId, name }),
        },
        'Failed to update competitor name'
      );
      updateCompetitor(competitorId, updated);
      setSavedCompetitorId(competitorId);
      setTimeout(() => setSavedCompetitorId(undefined), 2000);
    } catch (error) {
      console.error(error);
      showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
    }
  }, 800);

  const onCompetitorNameChange = (competitorId: string, name: string) => {
    setEditingNames((prev) => ({ ...prev, [competitorId]: name }));
    debouncedSaveName(competitorId, name);
  };

  const archivedCompetitors = allCurrentCompetitors.filter((c) => c.is_archived);

  useEffect(() => {
    if (!allCurrentCompetitors) return;
    setCompetitors(allCurrentCompetitors.filter((c) => !c.is_archived));
  }, [allCurrentCompetitors]);

  const onArchiveCompetitor = (competitorId: string) => {
    if (!currentProject) return;
    if (!competitors) return;
    setRemovingCompetitorId(competitorId);
    startRemovingTransition(async () => {
      try {
        await appFetch(
          RouteHelper.Api.Project.getCompetitors(currentProject.id),
          {
            method: 'DELETE',
            body: JSON.stringify({ competitorId }),
          },
          'Failed to remove competitor'
        );

        archiveCompetitor(competitorId);
        showSuccessAlertToast('Competitor archived', 'The competitor has been archived');
        setRemovingCompetitorId(undefined);
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onUnarchiveCompetitor = (competitorId: string) => {
    if (!currentProject) return;
    setRestoringCompetitorId(competitorId);
    startRestoringTransition(async () => {
      try {
        const restored = await appFetch<CompetitorRow>(
          RouteHelper.Api.Project.getCompetitors(currentProject.id),
          {
            method: 'PATCH',
            body: JSON.stringify({ competitorId }),
          },
          'Failed to restore competitor'
        );

        addCompetitor(restored);
        showSuccessAlertToast('Competitor restored', 'The competitor has been restored');
        setRestoringCompetitorId(undefined);
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const onAddCustom = () => {
    if (
      !currentProject ||
      !competitors ||
      !customUrlDebounced.length ||
      isDebouncePending() ||
      !isValidUrl(customUrlDebounced) ||
      isDuplicateUrl(customUrlDebounced, competitors) ||
      isDuplicateName(customName, competitors)
    ) {
      return;
    }

    startAddingTransition(async () => {
      try {
        const newCompetitor = await appFetch<CompetitorRow>(
          RouteHelper.Api.Project.getCompetitors(currentProject.id),
          {
            method: 'POST',
            body: JSON.stringify({
              url: customUrlDebounced,
              name: customName || undefined,
              iconUrl: customIconUrl || undefined,
            }),
          },
          'Failed to add competitor'
        );

        addCompetitor(newCompetitor);
        setCustomUrl('');
        setCustomName('');
        setCustomIconUrl('');
        showSuccessAlertToast('Competitor added', 'The competitor has been added');
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    onAddCustom();
  };

  const isUrlInvalid = !!customUrlDebounced.length && !isValidUrl(customUrlDebounced);
  const isUrlDuplicate =
    !!customUrlDebounced.length && isDuplicateUrl(customUrlDebounced, competitors ?? []);
  const isNameInvalid = !!customName.length && isDuplicateName(customName, competitors ?? []);

  const error =
    (isUrlInvalid && 'Invalid URL') ||
    (isUrlDuplicate && 'URL already used') ||
    (isNameInvalid && 'Name already used') ||
    undefined;

  const canAdd =
    !!customUrlDebounced.length &&
    !isUrlInvalid &&
    !isUrlDuplicate &&
    !isDebouncePending() &&
    !isNameInvalid &&
    !isAdding;

  return (
    <div className="flex max-w-xl flex-col gap-10">
      <Form className="flex flex-col gap-5" onSubmit={onAddCustom}>
        <SettingsFormHeader
          title="Competitors"
          description="The competitors you want to monitor and benchmark against."
        />

        {competitors === undefined ? (
          <LoadingIndicator />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {competitors.map((competitor) => (
                <div key={competitor.url} className="flex flex-row gap-2">
                  <InputGroup
                    value={competitor.url}
                    size="md"
                    isDisabled
                    trailingAddon={
                      competitor.icon_url ? (
                        <InputGroup.Prefix>
                          <Favicon
                            url={competitor.icon_url}
                            alt={competitor.name ?? competitor.hostname}
                            className="size-6"
                          />
                        </InputGroup.Prefix>
                      ) : null
                    }
                    className="flex-1 border-r-0"
                  >
                    <InputBase type="url" placeholder="https://brand.com" />
                  </InputGroup>

                  <Input
                    value={editingNames[competitor.id] ?? competitor.name ?? ''}
                    onChange={(value) => onCompetitorNameChange(competitor.id, value)}
                    isRequired
                    type="text"
                    placeholder="Name"
                    size="md"
                    className="flex-1"
                  />

                  <Button
                    color="secondary"
                    size="md"
                    className="h-auto w-11 shrink-0"
                    onClick={() => onArchiveCompetitor(competitor.id)}
                    isDisabled={
                      savedCompetitorId === competitor.id ||
                      (isRemoving && removingCompetitorId === competitor.id)
                    }
                  >
                    {savedCompetitorId === competitor.id ? (
                      <Check size={14} className="text-success-600" />
                    ) : isRemoving && removingCompetitorId === competitor.id ? (
                      <LoadingIndicator size="xxs" />
                    ) : (
                      <Minus size={14} />
                    )}
                  </Button>
                </div>
              ))}

              <div className="mt-4 -mb-1 ml-1 flex text-sm">New competitor</div>
              <div className="flex flex-row gap-2">
                <InputGroup
                  value={customUrl}
                  onChange={setCustomUrl}
                  isInvalid={isUrlInvalid || isUrlDuplicate}
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
                  isDisabled={!canAdd || isAdding}
                >
                  {isAdding ? <LoadingIndicator size="xxs" /> : <Plus size={14} />}
                </Button>
              </div>
            </div>

            {error && <div className="text-error-800 -mt-4 ml-0.5 text-xs">{error}</div>}

            {!!archivedCompetitors.length && (
              <div className="mt-2 flex flex-col">
                <button
                  type="button"
                  onClick={() => setShouldShowArchived((prev) => !prev)}
                  className="text-tertiary hover:text-secondary flex cursor-pointer items-center gap-1.5 self-start text-sm transition-colors"
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      shouldShowArchived ? 'rotate-180' : ''
                    }`}
                  />
                  Show archived competitors ({archivedCompetitors.length})
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                    shouldShowArchived ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-2 pt-3">
                      {archivedCompetitors.map((competitor) => (
                        <div
                          key={competitor.url}
                          className="flex flex-row gap-2 opacity-60 transition-opacity hover:opacity-100"
                        >
                          <InputGroup
                            value={competitor.url}
                            size="md"
                            isDisabled
                            trailingAddon={
                              competitor.icon_url ? (
                                <InputGroup.Prefix>
                                  <Favicon
                                    url={competitor.icon_url}
                                    alt={competitor.name ?? competitor.hostname}
                                    className="size-6"
                                  />
                                </InputGroup.Prefix>
                              ) : null
                            }
                            className="flex-1 border-r-0"
                          >
                            <InputBase type="url" placeholder="https://brand.com" />
                          </InputGroup>

                          <Input
                            value={competitor.name ?? ''}
                            isRequired
                            isDisabled
                            type="text"
                            placeholder="Name"
                            size="md"
                            className="flex-1"
                          />

                          <Button
                            color="secondary"
                            size="md"
                            className="h-auto shrink-0"
                            onClick={() => onUnarchiveCompetitor(competitor.id)}
                            isDisabled={isRestoring && restoringCompetitorId === competitor.id}
                          >
                            {isRestoring && restoringCompetitorId === competitor.id ? (
                              <LoadingIndicator size="xxs" />
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
          </>
        )}
      </Form>
    </div>
  );
}
