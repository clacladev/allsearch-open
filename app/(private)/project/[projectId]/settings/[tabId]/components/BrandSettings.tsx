import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { useDebounce } from 'use-debounce';
import { useEffect, useState } from 'react';
import { useTransition } from 'react';
import { useDomainMetadata } from '@/app/(new-project)/new-project/components/useDomainMetadata';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { BrandDetailsFields } from '@/components/shared/BrandDetailsFields';
import SettingsFormHeader from '@/components/settings/SettingsFormHeader';
import { RouteHelper } from '@/libs/routes';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { appFetch } from '@/hooks/appFetch';
import { ProjectRow } from '@/libs/database/Projects/types';
import { isValidUrl } from '@/libs/utils/urls';

export default function BrandSettings() {
  const { currentProject, setCurrentProject, projects, setProjects } = usePrivateLayoutContext();
  const [name, setName] = useState('');
  const [shouldFetchDomainMetadata, setShouldFetchDomainMetadata] = useState(false);
  const [url, setUrl] = useState('');
  const [urlDebounced, { isPending: isDebouncePending }] = useDebounce(url, 500);
  const [iconUrl, setIconUrl] = useState('');
  const [isTargetLocationSelected, setIsTargetLocationSelected] = useState(false);
  const [targetLocation, setTargetLocation] = useState('');
  const [isSaving, startSaveTransition] = useTransition();

  const { data: metadata, isLoading: isLoadingDomainMetadata } = useDomainMetadata(
    shouldFetchDomainMetadata && !isDebouncePending() ? urlDebounced : undefined
  );

  useEffect(() => {
    if (!metadata) return;
    setName(metadata.name ?? '');
    setIconUrl(metadata.iconUrl ?? '');
  }, [metadata?.url]);

  useEffect(() => {
    if (!currentProject) return;
    setName(currentProject.name ?? '');
    setUrl(currentProject.url ?? '');
    setIconUrl(currentProject.icon_url ?? '');
    setIsTargetLocationSelected(!!currentProject.target_location?.length);
    setTargetLocation(currentProject.target_location ?? '');
  }, [currentProject]);

  const onUrlChange = (value: string) => {
    setUrl(value);
    setIconUrl('');
    setShouldFetchDomainMetadata(true);
  };

  const onSave = (e: React.FormEvent<HTMLFormElement | HTMLButtonElement>) => {
    e.preventDefault();
    if (
      !currentProject ||
      !urlDebounced.length ||
      isDebouncePending() ||
      !isValidUrl(urlDebounced) ||
      isNameInvalid
    ) {
      return;
    }

    startSaveTransition(async () => {
      try {
        const updatedProject = await appFetch<ProjectRow>(
          RouteHelper.Api.Project.getProject(currentProject.id),
          {
            method: 'PATCH',
            body: JSON.stringify({
              url: urlDebounced,
              name,
              iconUrl,
              targetLocation: isTargetLocationSelected
                ? targetLocation.trim() || undefined
                : undefined,
            }),
          },
          'Failed to update project'
        );

        // Update the current project
        setCurrentProject(updatedProject);
        // Update the projects list
        const newAllProjects = projects?.map((project) =>
          project.id === currentProject.id ? updatedProject : project
        );
        setProjects(newAllProjects);
        showSuccessAlertToast('Brand updated', 'The brand has been updated');
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const isUrlInvalid = !!urlDebounced.length && !isValidUrl(urlDebounced);
  const isNameInvalid = !name.length;
  const canSave = !!urlDebounced.length && !isUrlInvalid && !isDebouncePending() && !isNameInvalid;

  return (
    <div className="flex max-w-md flex-col gap-10">
      <form className="flex flex-col gap-5" onSubmit={onSave}>
        <SettingsFormHeader
          title="Your Brand"
          description="The brand you want to monitor and analyze."
        />

        <BrandDetailsFields
          url={url}
          name={name}
          iconUrl={iconUrl}
          targetLocation={targetLocation}
          isTargetLocationSelected={isTargetLocationSelected}
          isLoadingMetadata={isLoadingDomainMetadata}
          isUrlInvalid={isUrlInvalid}
          isNameInvalid={isNameInvalid}
          onUrlChange={onUrlChange}
          onNameChange={setName}
          onTargetLocationSelectedChange={setIsTargetLocationSelected}
          onTargetLocationChange={setTargetLocation}
        />

        <Button type="submit" size="lg" disabled={!canSave || isSaving}>
          Save {isSaving && <Spinner aria-hidden="true" />}
        </Button>
      </form>
    </div>
  );
}
