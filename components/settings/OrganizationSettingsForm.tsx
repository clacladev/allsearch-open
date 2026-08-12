'use client';

import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { useDebounce } from 'use-debounce';
import { useEffect, useState } from 'react';
import { useTransition } from 'react';
import { useDomainMetadata } from '@/app/(new-project)/new-project/components/useDomainMetadata';
import { Favicon } from '@/app/(private)/components/Favicon';
import SettingsFormHeader from '@/components/settings/SettingsFormHeader';
import { RouteHelper } from '@/libs/routes';
import { showErrorAlertToast, showSuccessAlertToast } from '@/components/Alerts';
import { OrganizationRow, OrganizationType } from '@/libs/database/Organizations/types';
import { ORGANIZATION_TYPES } from '@/app/(new-project)/organization/helpers';
import { appFetch } from '@/hooks/appFetch';
import { isValidUrl } from '@/libs/utils/urls';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';

/** The Organization is a single settings row describing who the operator is, not a tenant
 * (ADR 0003). It is edited from two places — the app-level Settings screen and the per-Project
 * settings tab — so the form lives here rather than under either route. */
export default function OrganizationSettingsForm() {
  const { organization, setOrganization } = usePrivateLayoutContext();
  const [organizationType, setOrganizationType] = useState<OrganizationType>(OrganizationType.Agency);
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

  const onSave = (e: React.FormEvent<HTMLFormElement>) => {
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
      <form className="flex flex-col gap-5" onSubmit={onSave}>
        <SettingsFormHeader
          title="Your Organization"
          description="Information about who you are."
        />

        <RadioGroup
          aria-label="Account type"
          value={organizationType}
          onValueChange={(value) => setOrganizationType(value)}
          className="mb-6 gap-3"
        >
          {ORGANIZATION_TYPES.map((organizationTypeOption) => {
            const inputId = `organization-type-${organizationTypeOption.value}`;

            return (
              <Field
                key={organizationTypeOption.value}
                orientation="horizontal"
                onClick={() => setOrganizationType(organizationTypeOption.value)}
                className="has-data-checked:border-shadcn-primary/30 has-data-checked:bg-shadcn-primary/5 dark:has-data-checked:border-shadcn-primary/20 dark:has-data-checked:bg-shadcn-primary/10 cursor-pointer rounded-lg border p-4"
              >
                <RadioGroupItem id={inputId} value={organizationTypeOption.value} />
                <FieldContent>
                  <FieldLabel htmlFor={inputId}>{organizationTypeOption.title}</FieldLabel>
                  <FieldDescription>{organizationTypeOption.description}</FieldDescription>
                </FieldContent>
              </Field>
            );
          })}
        </RadioGroup>

        {organizationType === OrganizationType.Agency && (
          <>
            <Field data-invalid={isUrlInvalid || undefined}>
              <FieldLabel htmlFor="agency-url">Agency URL</FieldLabel>
              <div className="flex">
                <Input
                  id="agency-url"
                  value={url}
                  onChange={(event) => onUrlChange(event.target.value)}
                  aria-describedby={error ? 'agency-url-error' : undefined}
                  aria-invalid={isUrlInvalid || undefined}
                  required
                  type="url"
                  name="agencyUrl"
                  placeholder="https://agency.com"
                  className="rounded-r-none"
                />
                {(isLoadingDomainMetadata || iconUrl) && (
                  <div className="border-input flex size-9 shrink-0 items-center justify-center rounded-r-md border border-l-0 bg-transparent">
                    {isLoadingDomainMetadata ? (
                      <Spinner aria-label="Loading agency details" />
                    ) : (
                      <Favicon url={iconUrl} alt={agencyName} className="size-6" />
                    )}
                  </div>
                )}
              </div>
              <FieldError id="agency-url-error">{error}</FieldError>
            </Field>

            <Field data-invalid={isNameInvalid || undefined}>
              <FieldLabel htmlFor="agency-name">Agency Name</FieldLabel>
              <Input
                id="agency-name"
                value={agencyName}
                onChange={(event) => setAgencyName(event.target.value)}
                aria-invalid={isNameInvalid || undefined}
                required
                type="text"
                name="agencyName"
                placeholder="Superstar"
              />
              {isNameInvalid && <FieldError>Agency name is required</FieldError>}
            </Field>
          </>
        )}

        <Button type="submit" size="lg" disabled={!canSave || isSaving}>
          {isSaving && <Spinner aria-hidden="true" />}
          Save
        </Button>
      </form>
    </div>
  );
}
