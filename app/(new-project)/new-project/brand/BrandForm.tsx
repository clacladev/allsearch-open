'use client';

import { Button } from '@/components/base/buttons/button';
import { Input, InputBase } from '@/components/base/input/input';
import { useEffect, useState, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import { ROUTES } from '@/libs/routes';
import { InputGroup } from '@/components/base/input/input-group';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { useDomainMetadata } from '../components/useDomainMetadata';
import FormHeader from '../components/FormHeader';
import { useNewProjectContext } from '../components/NewProjectContext';
import { useRouter } from 'next/navigation';
import { NewProjectLayoutColumn } from '../../layout';
import { Favicon } from '@/app/(private)/components/Favicon';
import { isValidUrl } from '@/libs/utils/urls';
import { ArrowRight } from '@untitledui/icons';
import { OnboardingProgressSteps } from '../components/OnboardingProgressSteps';
import { Checkbox } from '@/components/base/checkbox/checkbox';

export default function BrandForm() {
  const router = useRouter();
  const { brand, setBrand, resetAll: resetNewProjectContext } = useNewProjectContext();
  const [shouldFetchDomainMetadata, setShouldFetchDomainMetadata] = useState(false);
  const [url, setUrl] = useState(brand?.url ?? '');
  const [urlDebounced, { isPending: isDebouncePending }] = useDebounce(url, 500);
  const [name, setName] = useState(brand?.name ?? '');
  const [iconUrl, setIconUrl] = useState(brand?.iconUrl ?? '');
  const [isTargetLocationSelected, setIsTargetLocationSelected] = useState(
    !!brand?.targetLocation?.length
  );
  const [targetLocation, setTargetLocation] = useState(brand?.targetLocation ?? '');
  const [isUpdating, startTransition] = useTransition();

  const { data: metadata, isLoading: isLoadingDomainMetadata } = useDomainMetadata(
    shouldFetchDomainMetadata && !isDebouncePending() ? urlDebounced : undefined
  );

  useEffect(() => {
    if (!metadata) return;
    setName(metadata.name ?? '');
    setIconUrl(metadata.iconUrl ?? '');
  }, [metadata?.url]);

  const onUrlChange = (value: string) => {
    setUrl(value);
    setIconUrl('');
    setShouldFetchDomainMetadata(true);
  };

  const onContinue = () => {
    if (!urlDebounced.length || isDebouncePending() || !isValidUrl(urlDebounced) || isNameInvalid) {
      return;
    }

    startTransition(() => {
      const hasUrlChanged = urlDebounced !== brand?.url;
      const hasTargetLocationChanged = isTargetLocationSelected
        ? targetLocation !== brand?.targetLocation
        : !!brand?.targetLocation?.length;

      if (hasUrlChanged || hasTargetLocationChanged) resetNewProjectContext();

      setBrand({
        url: urlDebounced,
        name,
        iconUrl,
        targetLocation: isTargetLocationSelected ? targetLocation.trim() || undefined : undefined,
      });
      router.push(ROUTES.NEW_PROJECT.TOPICS);
    });
  };

  const isUrlInvalid = !!urlDebounced.length && !isValidUrl(urlDebounced);
  const isNameInvalid = !name.length;
  const canContinue =
    !!urlDebounced.length && !isUrlInvalid && !isDebouncePending() && !isNameInvalid;

  const error = (isUrlInvalid && 'Invalid URL') || undefined;

  return (
    <NewProjectLayoutColumn>
      <div className="flex flex-col gap-5">
        <FormHeader title="Your Brand" description="The brand you want to monitor and analyze." />

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
          type="button"
          size="lg"
          isDisabled={!canContinue || isUpdating}
          isLoading={isUpdating}
          onClick={onContinue}
          iconTrailing={ArrowRight}
          className="mt-10"
        >
          Continue
        </Button>

        <OnboardingProgressSteps currentStep={0} className="mt-5" />
      </div>
    </NewProjectLayoutColumn>
  );
}
