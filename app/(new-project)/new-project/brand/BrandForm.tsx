'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useEffect, useState, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import { ROUTES } from '@/libs/routes';
import { useDomainMetadata } from '../components/useDomainMetadata';
import FormHeader from '../components/FormHeader';
import { useNewProjectContext } from '../components/NewProjectContext';
import { useRouter } from 'next/navigation';
import { NewProjectLayoutColumn } from '../../layout';
import { isValidUrl } from '@/libs/utils/urls';
import { ArrowRight } from 'lucide-react';
import { OnboardingProgressSteps } from '../components/OnboardingProgressSteps';
import { BrandDetailsFields } from '@/components/shared/BrandDetailsFields';

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

  return (
    <NewProjectLayoutColumn>
      <div className="flex flex-col gap-5">
        <FormHeader title="Your Brand" description="The brand you want to monitor and analyze." />

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

        <Button
          type="button"
          size="lg"
          disabled={!canContinue || isUpdating}
          onClick={onContinue}
          className="mt-10"
        >
          Continue <ArrowRight aria-hidden="true" /> {isUpdating && <Spinner aria-hidden="true" />}
        </Button>

        <OnboardingProgressSteps currentStep={0} className="mt-5" />
      </div>
    </NewProjectLayoutColumn>
  );
}
