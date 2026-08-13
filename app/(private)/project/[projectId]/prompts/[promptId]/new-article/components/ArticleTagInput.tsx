'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type Props = {
  label: string;
  tooltip: string;
  value: string[];
  onChange: (next: string[]) => void;
  maxItems: number;
  placeholder: string;
  hint: string;
  onValidate?: (raw: string) => string | undefined;
};

/** Route-local tags control: article settings are not a shared application pattern. */
export function ArticleTagInput({
  label,
  tooltip,
  value,
  onChange,
  maxItems,
  placeholder,
  hint,
  onValidate,
}: Props) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string>();
  const inputId = useId();
  const descriptionId = useId();

  const addDraft = (raw = draft) => {
    const next = raw.trim();
    if (!next) return;
    const validationError = onValidate?.(next);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (value.includes(next)) {
      setDraft('');
      setError(undefined);
      return;
    }
    if (value.length >= maxItems) {
      setError(`Add up to ${maxItems} items.`);
      return;
    }
    onChange([...value, next]);
    setDraft('');
    setError(undefined);
  };

  const addAllDrafts = (raw: string) => {
    const nextValues = [...value];
    let isAtCapacity = false;
    for (const part of raw.split(',')) {
      const next = part.trim();
      if (!next || nextValues.includes(next)) continue;
      if (nextValues.length >= maxItems) {
        isAtCapacity = true;
        break;
      }
      const validationError = onValidate?.(next);
      if (validationError) {
        setDraft(next);
        setError(validationError);
        onChange(nextValues);
        return;
      }
      nextValues.push(next);
    }
    onChange(nextValues);
    setDraft('');
    setError(isAtCapacity ? `Add up to ${maxItems} items.` : undefined);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addDraft();
      return;
    }
    if (event.key === 'Backspace' && !draft && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
      setError(undefined);
    }
  };

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={inputId} title={tooltip}>
        {label}
      </FieldLabel>
      <div className="border-input focus-within:border-ring focus-within:ring-ring/50 flex flex-wrap gap-1.5 rounded-md border p-1.5 focus-within:ring-3">
        {value.map((tag) => (
          <span
            key={tag}
            className="bg-secondary text-secondary-foreground inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs"
          >
            {tag}
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter((item) => item !== tag))}
            >
              <X aria-hidden="true" />
            </Button>
          </span>
        ))}
        <Input
          id={inputId}
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            if (next.includes(',')) {
              addAllDrafts(next);
              return;
            }
            setDraft(next);
            setError(undefined);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => addDraft()}
          placeholder={placeholder}
          aria-describedby={descriptionId}
          aria-errormessage={error ? descriptionId : undefined}
          aria-invalid={!!error || undefined}
          className="h-7 min-w-40 flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
        />
      </div>
      <FieldDescription id={descriptionId} className={error ? 'text-destructive' : undefined}>
        {error ?? hint}
      </FieldDescription>
    </Field>
  );
}
