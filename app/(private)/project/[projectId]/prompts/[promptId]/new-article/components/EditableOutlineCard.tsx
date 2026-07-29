'use client';

import { useId, useMemo, useState } from 'react';
import { Trash01 } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';
import {
  HEADING_KEY_POINT_MAX,
  HEADING_KEY_POINT_MIN,
  HEADING_TAGS,
  HEADING_TEXT_MAX,
  HEADING_TEXT_MIN,
  OUTLINE_HEADINGS_MAX,
  OUTLINE_HEADINGS_MIN,
} from '@/libs/ai/promptArticles/schema';
import type {
  ArticleOutline,
  ArticleOutlineHeading,
  ArticleOutlineHeadingTag,
} from '@/libs/database/PromptArticles/types';
import { isHeadingEdited } from '@/libs/utils/articleOutlineDiff';
import type { EditKind } from '../hooks/useOutlineAutosave';

export { isHeadingEdited };

const HEADING_LEVEL: Record<ArticleOutlineHeadingTag, number> = {
  h1: 0,
  h2: 1,
  h3: 2,
  h4: 3,
  h5: 4,
  h6: 5,
};

export type EditableHeading = ArticleOutlineHeading & { _uid: string };

type Props = {
  initialOutline: ArticleOutline;
  originalOutline: ArticleOutline;
  onChange: (next: ArticleOutline, kind: EditKind) => void;
  isDisabled?: boolean;
};

function stripUid(headings: EditableHeading[]): ArticleOutlineHeading[] {
  return headings.map(({ _uid: _, ...rest }) => rest);
}

function newUid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `row-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function EditableOutlineCard({
  initialOutline,
  originalOutline,
  onChange,
  isDisabled,
}: Props) {
  // Lazy initializer runs once on mount, after hydration — so server and
  // client renders never disagree on the _uid keys.
  const [headings, setHeadings] = useState<EditableHeading[]>(() =>
    initialOutline.headings.map((h) => ({ ...h, _uid: newUid() }))
  );

  const hasH1 = useMemo(() => headings.some((h) => h.tag === 'h1'), [headings]);

  const update = (next: EditableHeading[], kind: EditKind) => {
    setHeadings(next);
    onChange({ version: initialOutline.version, headings: stripUid(next) }, kind);
  };

  const onTextChange = (uid: string, text: string) => {
    update(
      headings.map((h) => (h._uid === uid ? { ...h, text } : h)),
      'text'
    );
  };

  const onKeyPointChange = (uid: string, keyPoint: string) => {
    update(
      headings.map((h) => (h._uid === uid ? { ...h, keyPoint } : h)),
      'keyPoint'
    );
  };

  const onTagChange = (uid: string, tag: ArticleOutlineHeadingTag) => {
    if (tag === 'h1' && headings.some((h) => h._uid !== uid && h.tag === 'h1')) return;
    update(
      headings.map((h) => (h._uid === uid ? { ...h, tag } : h)),
      'tag'
    );
  };

  const onDelete = (uid: string) => {
    if (headings.length <= OUTLINE_HEADINGS_MIN) return;
    update(
      headings.filter((h) => h._uid !== uid),
      'delete'
    );
  };

  const onAdd = () => {
    if (headings.length >= OUTLINE_HEADINGS_MAX) return;
    const next: EditableHeading = {
      _uid: newUid(),
      tag: 'h2',
      text: 'New heading',
      keyPoint: 'Describe what to cover.',
    };
    update([...headings, next], 'add');
  };

  const canDelete = headings.length > OUTLINE_HEADINGS_MIN;
  const canAdd = headings.length < OUTLINE_HEADINGS_MAX;

  return (
    <article
      aria-label="Article outline"
      className={cx(
        'border-secondary bg-secondary rounded-xl border p-4 sm:p-5',
        isDisabled && 'pointer-events-none opacity-60'
      )}
    >
      <ul className="flex list-none flex-col gap-3">
        {headings.map((heading, index) => {
          const original = originalOutline.headings[index];
          const edited = isHeadingEdited(heading, original);
          const level = HEADING_LEVEL[heading.tag] ?? 0;
          return (
            <EditableHeadingRow
              key={heading._uid}
              heading={heading}
              level={level}
              isEdited={edited}
              hasH1={hasH1}
              canDelete={canDelete}
              onTextChange={onTextChange}
              onKeyPointChange={onKeyPointChange}
              onTagChange={onTagChange}
              onDelete={onDelete}
            />
          );
        })}
      </ul>

      <div className="mt-4" style={{ paddingLeft: '18px' }}>
        <Button
          color="tertiary"
          size="sm"
          onClick={onAdd}
          isDisabled={!canAdd}
          aria-label={canAdd ? 'Add heading' : `Maximum reached (${OUTLINE_HEADINGS_MAX}/${OUTLINE_HEADINGS_MAX})`}
        >
          {canAdd ? '+ Add heading' : `${OUTLINE_HEADINGS_MAX}/${OUTLINE_HEADINGS_MAX}`}
        </Button>
      </div>
    </article>
  );
}

type RowProps = {
  heading: EditableHeading;
  level: number;
  isEdited: boolean;
  hasH1: boolean;
  canDelete: boolean;
  onTextChange: (uid: string, text: string) => void;
  onKeyPointChange: (uid: string, keyPoint: string) => void;
  onTagChange: (uid: string, tag: ArticleOutlineHeadingTag) => void;
  onDelete: (uid: string) => void;
};

function EditableHeadingRow({
  heading,
  level,
  isEdited,
  hasH1,
  canDelete,
  onTextChange,
  onKeyPointChange,
  onTagChange,
  onDelete,
}: RowProps) {
  const textId = useId();
  const keyPointId = useId();
  const textHintId = `${textId}-hint`;
  const keyPointHintId = `${keyPointId}-hint`;

  const textTooShort = heading.text.length > 0 && heading.text.length < HEADING_TEXT_MIN;
  const textTooLong = heading.text.length > HEADING_TEXT_MAX;
  const keyPointTooShort =
    heading.keyPoint.length > 0 && heading.keyPoint.length < HEADING_KEY_POINT_MIN;
  const keyPointTooLong = heading.keyPoint.length > HEADING_KEY_POINT_MAX;

  return (
    <li
      className="group flex flex-col gap-0"
      style={{ paddingLeft: `${level * 18}px` }}
    >
      <div className="flex items-start gap-2">
        <select
          aria-label={`Heading level for ${heading.text || 'this heading'}`}
          value={heading.tag}
          onChange={(e) => onTagChange(heading._uid, e.target.value as ArticleOutlineHeadingTag)}
          className="text-secondary hover:bg-primary hover:ring-primary focus:bg-primary focus:ring-brand mt-0.5 inline-flex h-7 cursor-pointer rounded-md bg-transparent px-1.5 text-xs font-medium uppercase ring-1 ring-transparent ring-inset outline-hidden transition-colors hover:ring-1 focus:ring-2"
        >
          {HEADING_TAGS.map((tag) => {
            const disabled = tag === 'h1' && hasH1 && heading.tag !== 'h1';
            return (
              <option key={tag} value={tag} disabled={disabled}>
                {tag.toUpperCase()}
              </option>
            );
          })}
        </select>

        {isEdited && (
          <span
            className="bg-fg-brand-secondary mt-2.5 inline-flex size-1.5 shrink-0 rounded-full"
            title="Edited"
          >
            <span className="sr-only">edited</span>
          </span>
        )}

        <input
          id={textId}
          type="text"
          aria-describedby={textHintId}
          aria-invalid={textTooShort || textTooLong}
          value={heading.text}
          onChange={(e) => onTextChange(heading._uid, e.target.value)}
          placeholder="Heading text"
          className={cx(
            // Idle: blends with the card. Hover/focus surfaces the input shape.
            'text-primary hover:bg-primary hover:ring-primary focus:bg-primary focus:ring-brand h-9 flex-1 rounded-md bg-transparent px-2.5 py-1.5 text-sm leading-snug ring-1 ring-transparent outline-hidden ring-inset transition-colors hover:ring-1 focus:ring-2',
            heading.tag === 'h1' && 'text-base font-semibold',
            heading.tag === 'h2' && 'font-semibold',
            (textTooShort || textTooLong) && 'ring-error-primary'
          )}
        />

        <button
          type="button"
          onClick={() => onDelete(heading._uid)}
          disabled={!canDelete}
          aria-label="Delete heading"
          className={cx(
            'text-fg-quaternary hover:text-error-primary inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md sm:h-9 sm:w-9 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100',
            !canDelete && 'cursor-not-allowed opacity-30'
          )}
        >
          <Trash01 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {(textTooShort || textTooLong) && (
        <p id={textHintId} className="text-error-primary pl-[3.25rem] text-xs">
          {textTooShort
            ? `Title needs at least ${HEADING_TEXT_MIN} characters`
            : `Title is at most ${HEADING_TEXT_MAX} characters`}
        </p>
      )}

      <textarea
        id={keyPointId}
        rows={2}
        aria-describedby={keyPointHintId}
        aria-invalid={keyPointTooShort || keyPointTooLong}
        value={heading.keyPoint}
        onChange={(e) => onKeyPointChange(heading._uid, e.target.value)}
        placeholder="Key point covered under this heading"
        className={cx(
          // Idle: blends with the card. Hover/focus surfaces the input shape.
          'text-tertiary hover:bg-primary hover:ring-primary focus:bg-primary focus:ring-brand w-full rounded-md bg-transparent px-2.5 py-1.5 text-sm leading-relaxed ring-1 ring-transparent outline-hidden ring-inset transition-colors hover:ring-1 focus:ring-2',
          (keyPointTooShort || keyPointTooLong) && 'ring-error-primary'
        )}
      />

      {(keyPointTooShort || keyPointTooLong) && (
        <p id={keyPointHintId} className="text-error-primary text-xs">
          {keyPointTooShort
            ? `Key point needs at least ${HEADING_KEY_POINT_MIN} characters`
            : `Key point is at most ${HEADING_KEY_POINT_MAX} characters`}
        </p>
      )}
    </li>
  );
}
