'use client';

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
import { useEffect, useState, useTransition } from 'react';
import { OrganizationType } from '@/libs/database/Organizations/types';
import { useDebounce } from 'use-debounce';
import { ROUTES } from '@/libs/routes';
import { useRouter } from 'next/navigation';
import { useDomainMetadata } from '../new-project/components/useDomainMetadata';
import FormHeader from '../new-project/components/FormHeader';
import { NewProjectLayoutColumn } from '../layout';
import { Favicon } from '@/app/(private)/components/Favicon';
import { ORGANIZATION_TYPES } from './helpers';
import useSWRMutation from 'swr/mutation';
import { UpdateOrganizationResponse } from '@/app/api/organization/types';
import { appFetch } from '@/hooks/appFetch';
import { isValidUrl } from '@/libs/utils/urls';
import { ArrowRight } from 'lucide-react';

const useUpdateOrganization = (
  type: OrganizationType,
  url: string | undefined,
  name: string | undefined,
  iconUrl: string | undefined
) =>
  useSWRMutation(['update-organization', type, url, name, iconUrl], async () =>
    appFetch<UpdateOrganizationResponse>(
      ROUTES.API.ORGANIZATION,
      {
        method: 'POST',
        body: JSON.stringify({
          type,
          url,
          name,
          iconUrl,
        }),
      },
      'Failed to update organization'
    )
  );

export default function OrganizationForm() {
  const router = useRouter();

  const [organizationType, setOrganizationType] = useState<OrganizationType>(
    OrganizationType.Agency
  );
  const [shouldFetchDomainMetadata, setShouldFetchDomainMetadata] = useState(false);
  const [url, setUrl] = useState('');
  const [urlDebounced, { isPending: isDebouncePending }] = useDebounce(url, 500);
  const [agencyName, setAgencyName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isUpdating, startTransition] = useTransition();

  const { trigger: updateOrganization } = useUpdateOrganization(
    organizationType,
    urlDebounced,
    agencyName,
    iconUrl
  );

  const { data: metadata, isLoading: isLoadingDomainMetadata } = useDomainMetadata(
    shouldFetchDomainMetadata && !isDebouncePending() ? urlDebounced : undefined
  );

  useEffect(() => {
    if (!metadata) return;
    setAgencyName(metadata.name ?? '');
    setIconUrl(metadata.iconUrl ?? '');
  }, [metadata?.url]);

  const onUrlChange = (value: string) => {
    setUrl(value);
    setIconUrl('');
    setShouldFetchDomainMetadata(true);
  };

  const onContinue = () => {
    if (
      organizationType === OrganizationType.Agency &&
      (!urlDebounced.length || isDebouncePending() || !isValidUrl(urlDebounced) || isNameInvalid)
    ) {
      return;
    }
    startTransition(async () => {
      const response = await updateOrganization();
      if (!response) throw new Error('Failed to update organization');
      if (!response.isUpdate) router.push(ROUTES.NEW_PROJECT.BRAND);
    });
  };

  const isAgency = organizationType === OrganizationType.Agency;
  const isUrlInvalid = isAgency && !!urlDebounced.length && !isValidUrl(urlDebounced);
  const isNameInvalid = isAgency && !agencyName.length;
  const canContinue = isAgency
    ? !!urlDebounced.length && !isUrlInvalid && !isDebouncePending() && !isNameInvalid
    : true;

  return (
    <NewProjectLayoutColumn>
      <div className="flex flex-col gap-5">
        <FormHeader
          title="Your Organization"
          description="To get started, please tell us who you are."
        />

        <RadioGroup
          aria-label="Account type"
          value={organizationType}
          onValueChange={(value) => setOrganizationType(value)}
          className="mb-6 gap-3"
        >
          {ORGANIZATION_TYPES.map((option) => {
            const id = `organization-type-${option.value}`;
            return (
              <Field
                key={option.value}
                orientation="horizontal"
                onClick={() => setOrganizationType(option.value)}
                className="border-border has-data-checked:border-shadcn-primary has-data-checked:bg-shadcn-primary/5 has-data-checked:ring-1 has-data-checked:ring-shadcn-primary/30 cursor-pointer rounded-lg border p-4"
              >
                <RadioGroupItem id={id} value={option.value} />
                <FieldContent>
                  <FieldLabel htmlFor={id}>{option.title}</FieldLabel>
                  <FieldDescription>{option.description}</FieldDescription>
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
                  aria-invalid={isUrlInvalid || undefined}
                  required
                  type="url"
                  name="agencyUrl"
                  placeholder="https://agency.com"
                  className="h-11 rounded-r-none text-md"
                />
                {(isLoadingDomainMetadata || iconUrl) && (
                  <div className="border-input flex size-11 shrink-0 items-center justify-center rounded-r-md border border-l-0">
                    {isLoadingDomainMetadata ? (
                      <Spinner aria-label="Loading agency details" />
                    ) : (
                      <Favicon url={iconUrl} alt={agencyName} className="size-6" />
                    )}
                  </div>
                )}
              </div>
              {isUrlInvalid && <FieldError>Invalid URL</FieldError>}
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
                className="h-11 text-md"
              />
              {isNameInvalid && <FieldError>Agency name is required</FieldError>}
            </Field>
          </>
        )}

        <Button type="button" size="lg" className="h-11" disabled={!canContinue || isUpdating} onClick={onContinue}>
          Continue <ArrowRight aria-hidden="true" /> {isUpdating && <Spinner aria-hidden="true" />}
        </Button>
      </div>
    </NewProjectLayoutColumn>
  );
}
