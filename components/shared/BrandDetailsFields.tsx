'use client';

import { Favicon } from '@/app/(private)/components/Favicon';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export function BrandDetailsFields({
  url,
  name,
  iconUrl,
  targetLocation,
  isTargetLocationSelected,
  isLoadingMetadata,
  isUrlInvalid,
  isNameInvalid,
  onUrlChange,
  onNameChange,
  onTargetLocationSelectedChange,
  onTargetLocationChange,
}: {
  url: string;
  name: string;
  iconUrl: string;
  targetLocation: string;
  isTargetLocationSelected: boolean;
  isLoadingMetadata: boolean;
  isUrlInvalid: boolean;
  isNameInvalid: boolean;
  onUrlChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onTargetLocationSelectedChange: (isSelected: boolean) => void;
  onTargetLocationChange: (value: string) => void;
}) {
  return (
    <>
      <Field data-invalid={isUrlInvalid || undefined}>
        <FieldLabel htmlFor="brand-url">Brand URL</FieldLabel>
        <div className="flex">
          <Input
            id="brand-url"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            aria-invalid={isUrlInvalid || undefined}
            required
            type="url"
            name="brandUrl"
            placeholder="https://brand.com"
            className="rounded-r-none"
          />
          {(isLoadingMetadata || iconUrl) && (
            <div className="border-input flex size-9 shrink-0 items-center justify-center rounded-r-md border border-l-0">
              {isLoadingMetadata ? (
                <Spinner aria-label="Loading brand details" />
              ) : (
                <Favicon url={iconUrl} alt={name} className="size-6" />
              )}
            </div>
          )}
        </div>
        {isUrlInvalid && <FieldError>Invalid URL</FieldError>}
      </Field>
      <Field data-invalid={isNameInvalid || undefined}>
        <FieldLabel htmlFor="brand-name">Brand Name</FieldLabel>
        <Input
          id="brand-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          aria-invalid={isNameInvalid || undefined}
          required
          type="text"
          name="brandName"
          placeholder="Ringo"
        />
        {isNameInvalid && <FieldError>Brand name is required</FieldError>}
      </Field>
      <div className="mt-1 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Checkbox
            id="target-specific-location"
            checked={isTargetLocationSelected}
            onCheckedChange={onTargetLocationSelectedChange}
          />
          <label htmlFor="target-specific-location" className="cursor-pointer">
            I want to target a specific location
          </label>
        </div>
        <p className="text-muted-foreground -mt-2 text-sm">Leave unchecked to keep worldwide.</p>
        {isTargetLocationSelected && (
          <Field>
            <FieldLabel htmlFor="target-location">Target location</FieldLabel>
            <Input
              id="target-location"
              value={targetLocation}
              onChange={(event) => onTargetLocationChange(event.target.value)}
              type="text"
              name="targetLocation"
              placeholder="Nation, state, city"
            />
          </Field>
        )}
      </div>
    </>
  );
}
