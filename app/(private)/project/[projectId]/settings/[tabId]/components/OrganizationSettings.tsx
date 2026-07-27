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
import SettingsFormHeader from './SettingsFormHeader';
import { RouteHelper } from '@/libs/routes';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { OrganizationRow, OrganizationType } from '@/libs/database/Organizations/types';
import { ORGANIZATION_TYPES } from '@/app/(new-project)/organization/helpers';
import { RadioGroupRadioButton } from '@/components/base/radio-groups/radio-group-radio-button';
import { appFetch } from '@/hooks/appFetch';
import { isValidUrl } from '@/libs/utils/urls';

export default function OrganizationSettings() {
  const { organization, setOrganization } = usePrivateLayoutContext();
  const [organizationType, setOrganizationType] = useState<OrganizationType | undefined>();
  const [agencyName, setAgencyName] = useState('');
  const [shouldFetchDomainMetadata, setShouldFetchDomainMetadata] = useState(false);
  const [url, setUrl] = useState('');
  const [urlDebounced, { isPending: isDebouncePending }] = useDebounce(url, 500);
  const [iconUrl, setIconUrl] = useState('');
  const [isSaving, startSaveTransition] = useTransition();

  const { data: metadata, isLoading: isLoadingDomainMetadata } = useDomainMetadata(
    shouldFetchDomainMetadata && !isDebouncePending() ? urlDebounced : undefined
  );

  useEffect(() => {
    if (!metadata) return;
    setAgencyName(metadata.name ?? '');
    setIconUrl(metadata.iconUrl ?? '');
  }, [metadata?.url]);

  useEffect(() => {
    if (!organization) return;
    setOrganizationType(organization.type ?? OrganizationType.Agency);
    setAgencyName(organization.name ?? '');
    setUrl(organization.url ?? '');
    setIconUrl(organization.icon_url ?? '');
  }, [organization]);

  const onUrlChange = (value: string) => {
    setUrl(value);
    setIconUrl('');
    setShouldFetchDomainMetadata(true);
  };

  const onSave = (e: React.FormEvent<HTMLFormElement | HTMLButtonElement>) => {
    e.preventDefault();
    if (
      !organization ||
      !urlDebounced.length ||
      isDebouncePending() ||
      !isValidUrl(urlDebounced) ||
      isNameInvalid
    ) {
      return;
    }

    startSaveTransition(async () => {
      try {
        const updatedOrganization = await appFetch<OrganizationRow>(
          RouteHelper.Api.getOrganization(organization.id),
          {
            method: 'PATCH',
            body: JSON.stringify({
              type: organizationType,
              url: urlDebounced,
              name: agencyName,
              iconUrl,
            }),
          },
          'Failed to update organization'
        );
        setOrganization(updatedOrganization);
        showSuccessAlertToast('Organization updated', 'The organization has been updated');
      } catch (error) {
        console.error(error);
        showErrorAlertToast('Something went wrong', error instanceof Error ? error.message : '');
      }
    });
  };

  const isAgency = organizationType === OrganizationType.Agency;
  const isUrlInvalid = isAgency && !!urlDebounced.length && !isValidUrl(urlDebounced);
  const isNameInvalid = isAgency && !agencyName.length;
  const canSave = isAgency
    ? !!urlDebounced.length && !isUrlInvalid && !isDebouncePending() && !isNameInvalid
    : true;

  const error = (isUrlInvalid && 'Invalid URL') || undefined;

  return (
    <div className="max-w-md">
      <Form className="flex flex-col gap-5" onSubmit={onSave}>
        <SettingsFormHeader
          title="Your Organization"
          description="Information about who you are."
        />

        <RadioGroupRadioButton
          aria-label="Account type"
          value={organizationType}
          onChange={(value) => setOrganizationType(value as OrganizationType)}
          items={ORGANIZATION_TYPES}
          className="mb-6"
        />

        {organizationType === OrganizationType.Agency && (
          <>
            <InputGroup
              value={url}
              onChange={onUrlChange}
              isInvalid={isUrlInvalid}
              isRequired
              label="Agency URL"
              name="agencyUrl"
              size="md"
              trailingAddon={
                isLoadingDomainMetadata ? (
                  <InputGroup.Prefix>
                    <LoadingIndicator size="xxs" />
                  </InputGroup.Prefix>
                ) : iconUrl ? (
                  <InputGroup.Prefix>
                    <Favicon url={iconUrl} alt={agencyName} className="size-6" />
                  </InputGroup.Prefix>
                ) : null
              }
              className="border-r-0"
            >
              <InputBase type="url" placeholder="https://agency.com" />
            </InputGroup>

            {error && <div className="text-error-800 -mt-4 ml-0.5 text-xs">{error}</div>}

            <Input
              value={agencyName}
              onChange={setAgencyName}
              isInvalid={isNameInvalid}
              isRequired
              label="Agency Name"
              type="text"
              name="agencyName"
              placeholder="Superstar"
              size="md"
            />
          </>
        )}

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
    </div>
  );
}
