'use client';

import { Button } from '@/components/base/buttons/button';
import { Input, InputBase } from '@/components/base/input/input';
import { RadioGroupRadioButton } from '@/components/base/radio-groups/radio-group-radio-button';
import { useEffect, useState, useTransition } from 'react';
import { OrganizationType } from '@/libs/database/Organizations/types';
import { useDebounce } from 'use-debounce';
import { ROUTES } from '@/libs/routes';
import { InputGroup } from '@/components/base/input/input-group';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
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
import { ArrowRight } from '@untitledui/icons';

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

  const error = (isUrlInvalid && 'Invalid URL') || undefined;

  return (
    <NewProjectLayoutColumn>
      <div className="flex flex-col gap-5">
        <FormHeader
          title="Your Organization"
          description="To get started, please tell us who you are."
        />

        <RadioGroupRadioButton
          aria-label="Account type"
          defaultValue={organizationType}
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
          type="button"
          size="lg"
          isDisabled={!canContinue || isUpdating}
          isLoading={isUpdating}
          onClick={onContinue}
          iconTrailing={ArrowRight}
        >
          Continue
        </Button>
      </div>
    </NewProjectLayoutColumn>
  );
}
