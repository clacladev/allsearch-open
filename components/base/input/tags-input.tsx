'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { XClose } from '@untitledui/icons';
import { HintText } from '@/components/base/input/hint-text';
import { Label } from '@/components/base/input/label';
import { cx } from '@/utils/cx';

type TagsInputProps = {
  label?: string;
  hint?: ReactNode;
  /** Field-level error. When set, the wrapper renders the invalid ring and
   * `hint` switches to error styling. */
  isInvalid?: boolean;
  isDisabled?: boolean;
  tooltip?: string;
  tooltipDescription?: string;
  placeholder?: string;
  /** Current tag values. Always controlled. */
  value: string[];
  onChange: (next: string[]) => void;
  /**
   * Optional per-chip validator. Return a string error message to reject the
   * entry; return `undefined` to accept. When invalid, the live input shows an
   * error ring + the message in `hint` slot.
   */
  onValidate?: (raw: string) => string | undefined;
  /** Cap on number of chips. The user can't add more once reached. */
  maxItems?: number;
  /** Additional class names for the outer wrapper. */
  className?: string;
};

const COMMIT_KEYS = new Set(['Enter', ',']);

/**
 * Free-form chip input. Type → press Enter or `,` (or paste a comma-separated
 * string) to commit a chip. Backspace on an empty input removes the last chip.
 *
 * Built without react-aria-components' TagGroup because we need free-form
 * entry; the existing MultiSelectBase requires a known item list. A small
 * controlled implementation is simpler and matches the surrounding `Input`
 * styling.
 */
export function TagsInput({
  label,
  hint,
  isInvalid,
  isDisabled,
  tooltip,
  tooltipDescription,
  placeholder,
  value,
  onChange,
  onValidate,
  maxItems,
  className,
}: TagsInputProps) {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  const atCapacity = maxItems !== undefined && value.length >= maxItems;

  const commitDraft = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) return false;
    if (atCapacity) {
      setDraftError(`Up to ${maxItems} entries`);
      return false;
    }
    if (value.includes(trimmed)) {
      // Silently dedupe — clear the draft, no error.
      setDraft('');
      setDraftError(undefined);
      return true;
    }
    if (onValidate) {
      const err = onValidate(trimmed);
      if (err) {
        setDraftError(err);
        return false;
      }
    }
    onChange([...value, trimmed]);
    setDraft('');
    setDraftError(undefined);
    return true;
  };

  const commitAll = (raw: string) => {
    // Allow paste of "a, b, c" by splitting on commas before committing.
    const parts = raw.split(',');
    if (parts.length === 1) {
      commitDraft(parts[0]);
      return;
    }
    const next = [...value];
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (maxItems !== undefined && next.length >= maxItems) {
        setDraftError(`Up to ${maxItems} entries`);
        break;
      }
      if (next.includes(trimmed)) continue;
      if (onValidate) {
        const err = onValidate(trimmed);
        if (err) {
          setDraft(trimmed);
          setDraftError(err);
          onChange(next);
          return;
        }
      }
      next.push(trimmed);
    }
    onChange(next);
    setDraft('');
    setDraftError(undefined);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (COMMIT_KEYS.has(e.key)) {
      e.preventDefault();
      commitDraft(draft);
      return;
    }
    if (e.key === 'Backspace' && draft.length === 0 && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
      setDraftError(undefined);
    }
  };

  const removeAt = (index: number) => {
    const next = value.slice();
    next.splice(index, 1);
    onChange(next);
    setDraftError(undefined);
  };

  const fieldInvalid = !!isInvalid || !!draftError;
  const visibleHint = draftError ?? hint;

  return (
    <div
      className={cx('group flex w-full flex-col items-start justify-start gap-1.5', className)}
    >
      {label && (
        <Label tooltip={tooltip} tooltipDescription={tooltipDescription}>
          {label}
        </Label>
      )}

      <div
        onClick={() => inputRef.current?.focus()}
        className={cx(
          'bg-primary ring-primary relative flex w-full flex-row flex-wrap items-center gap-1.5 rounded-lg px-2.5 py-2 shadow-xs ring-1 transition-shadow duration-100 ease-linear ring-inset',
          'focus-within:ring-brand focus-within:ring-2',
          fieldInvalid && 'ring-error_subtle focus-within:ring-error',
          isDisabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="bg-secondary text-secondary inline-flex max-w-full items-center gap-1 rounded-md px-2 py-0.5 text-sm"
          >
            <span className="truncate">{tag}</span>
            {!isDisabled && (
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                className="text-fg-quaternary hover:text-fg-quaternary_hover focus-visible:outline-focus-ring rounded-sm focus-visible:outline-2 focus-visible:outline-offset-1"
              >
                <XClose className="size-3.5" strokeWidth="2.5" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          disabled={isDisabled}
          placeholder={value.length === 0 ? placeholder : undefined}
          onChange={(e) => {
            const next = e.target.value;
            // If the user typed/pasted a comma anywhere, treat it as a commit
            // separator and split the buffer immediately.
            if (next.includes(',')) {
              commitAll(next);
              return;
            }
            setDraft(next);
            if (draftError) setDraftError(undefined);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim().length) commitDraft(draft);
          }}
          className="text-md text-primary placeholder:text-placeholder min-w-32 flex-1 bg-transparent outline-hidden"
        />
      </div>

      {visibleHint && <HintText isInvalid={fieldInvalid}>{visibleHint}</HintText>}
    </div>
  );
}
