import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { useDebounce } from 'use-debounce';
import { useEffect, useState } from 'react';
import { useTransition } from 'react';
import { useDomainMetadata } from '@/app/(new-project)/new-project/components/useDomainMetadata';
import { Form } from '@/components/base/form/form';
import { InputGroup } from '@/components/base/input/input-group';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { Favicon } from '@/app/(private)/components/Favicon';
import { Input, InputBase } from '@/components/base/input/input';
import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import SettingsFormHeader from './SettingsFormHeader';
import { RouteHelper } from '@/libs/routes';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { appFetch } from '@/hooks/appFetch';
import { ProjectRow } from '@/libs/database/Projects/types';
import { isValidUrl } from '@/libs/utils/urls';
import UpdateSourcesAnalisysAlert from './UpdateSourcesAnalisys';

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
  const [shouldShowUpdateSourcesAnalysis, setShouldShowUpdateSourcesAnalysis] = useState(false);

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

    setShouldShowUpdateSourcesAnalysis(false);

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
        setShouldShowUpdateSourcesAnalysis(true);
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

  const error = (isUrlInvalid && 'Invalid URL') || undefined;

  return (
    <div className="flex max-w-md flex-col gap-10">
      <Form className="flex flex-col gap-5" onSubmit={onSave}>
        <SettingsFormHeader
          title="Your Brand"
          description="The brand you want to monitor and analyze."
        />

        <InputGroup
          value={url}
          onChange={onUrlChange}
          isInvalid={isUrlInvalid}
          isRequired
          label="Brand URL"
          name="brandUrl"
          size="md"
          trailingAddon={
            isLoadingDomainMetadata ? (
              <InputGroup.Prefix>
                <LoadingIndicator size="xxs" />
              </InputGroup.Prefix>
            ) : iconUrl ? (
              <InputGroup.Prefix>
                <Favicon url={iconUrl} alt={name} className="size-6" />
              </InputGroup.Prefix>
            ) : null
          }
          className="border-r-0"
        >
          <InputBase type="url" placeholder="https://brand.com" />
        </InputGroup>

        {error && <div className="text-error-800 -mt-4 ml-0.5 text-xs">{error}</div>}

        <Input
          value={name}
          onChange={setName}
          isRequired
          label="Brand Name"
          type="text"
          name="brandName"
          placeholder="Ringo"
          size="md"
        />

        <div className="mt-1 flex flex-col gap-3">
          <Checkbox
            isSelected={isTargetLocationSelected}
            onChange={setIsTargetLocationSelected}
            size="sm"
            label="I want to target a specific location"
            hint="Leave unchecked to keep worldwide."
          />

          {isTargetLocationSelected && (
            <Input
              value={targetLocation}
              onChange={setTargetLocation}
              label="Target location"
              type="text"
              name="targetLocation"
              placeholder="Nation, state, city"
              size="md"
            />
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          isDisabled={!canSave || isSaving}
          isLoading={isSaving}
          onClick={onSave}
        >
          Save
        </Button>
      </Form>

      {shouldShowUpdateSourcesAnalysis && (
        <UpdateSourcesAnalisysAlert onClose={() => setShouldShowUpdateSourcesAnalysis(false)} />
      )}
    </div>
  );
}
