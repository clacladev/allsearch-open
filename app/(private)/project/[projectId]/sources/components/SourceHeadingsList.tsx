import { PageHeading } from '@/libs/utils/urlAnalysis';
import { Badge } from '@/components/base/badges/badges';
import { cx } from '@/utils/cx';

const HEADING_LEVEL: Record<string, number> = {
  h1: 0,
  h2: 1,
  h3: 2,
  h4: 3,
  h5: 4,
  h6: 5,
};

type SourceHeadingsListProps = {
  headings: PageHeading[];
  className?: string;
};

export const SourceHeadingsList = ({ headings, className }: SourceHeadingsListProps) => (
  <div className={cx(`border-secondary bg-secondary rounded-xl border p-4`, className)}>
    <ul className="flex list-none flex-col gap-1">
      {headings.map((heading, index) => {
        const level = HEADING_LEVEL[heading.tag] ?? 0;
        return (
          <li
            key={index}
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 15}px` }}
          >
            <Badge size="sm" color="gray" type="modern">
              {heading.tag.toUpperCase()}
            </Badge>
            <span className={`text-tertiary text-sm ${heading.tag === 'h1' && 'font-medium'}`}>
              {heading.text}
            </span>
          </li>
        );
      })}
    </ul>
  </div>
);
