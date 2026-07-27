'use client';

import type {
  ComponentPropsWithRef,
  ComponentType,
  HTMLAttributes,
  ReactNode,
  Ref,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { createContext, isValidElement, useContext } from 'react';
import { ArrowDown, ChevronSelectorVertical } from '@untitledui/icons';
import type {
  CellProps as AriaCellProps,
  ColumnProps as AriaColumnProps,
  RowProps as AriaRowProps,
  TableHeaderProps as AriaTableHeaderProps,
  TableProps as AriaTableProps,
} from 'react-aria-components';
import {
  Cell as AriaCell,
  Collection as AriaCollection,
  Column as AriaColumn,
  Group as AriaGroup,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  useTableOptions,
} from 'react-aria-components';
import { Badge } from '@/components/base/badges/badges';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { cx } from '@/utils/cx';
import { TooltipIcon } from '@/app/(private)/components/Tooltip';
import Link from 'next/link';

type TableSize = 'xs' | 'sm' | 'md';

const TableContext = createContext<{ size: TableSize }>({ size: 'md' });

const TableCardRoot = ({
  children,
  className,
  size = 'md',
  ...props
}: HTMLAttributes<HTMLDivElement> & { size?: TableSize }) => {
  return (
    <TableContext.Provider value={{ size }}>
      <div
        {...props}
        className={cx(
          'bg-primary ring-secondary overflow-hidden rounded-xl shadow-xs ring-1',
          className
        )}
      >
        {children}
      </div>
    </TableContext.Provider>
  );
};

interface TableCardHeaderProps {
  /** The title of the table card header. */
  title: string;
  /** The href of the title. */
  titleHref?: string;
  /** The icon displayed next to the title. */
  icon?: ComponentType<{ className?: string }>;
  /** The badge displayed next to the title. */
  badge?: ReactNode;
  /** The badge displayed before trailing content */
  badgeTrailing?: ReactNode;
  /** The description of the table card header. */
  description?: string;
  /** The tooltip of the table card header. */
  tooltip?: string;
  /** The content displayed after the title and badge. */
  contentTrailing?: ReactNode;
  /** The class name of the table card header. */
  className?: string;
}

const TableCardHeader = ({
  title,
  titleHref,
  icon,
  badge,
  badgeTrailing,
  description,
  tooltip,
  contentTrailing,
  className,
}: TableCardHeaderProps) => {
  const { size } = useContext(TableContext);
  const Icon = icon;

  const titleContent = (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="text-tertiary size-4" />}
      <h2
        className={cx(
          'text-primary font-semibold',
          size === 'xs' ? 'text-sm' : size === 'sm' ? 'text-md' : 'text-lg'
        )}
      >
        {title}
      </h2>
    </div>
  );

  return (
    <div
      className={cx(
        'border-secondary bg-primary relative flex items-center gap-4 border-b px-4',
        size === 'xs' ? 'py-3 md:px-4' : size === 'sm' ? 'py-4 md:px-5' : 'py-5 md:px-6',
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {titleHref ? <Link href={titleHref}>{titleContent}</Link> : titleContent}
          {tooltip && <TooltipIcon title={tooltip} />}
          {badge ? (
            isValidElement(badge) ? (
              badge
            ) : (
              <Badge color="brand" size="sm">
                {badge}
              </Badge>
            )
          ) : null}
        </div>
        {description && <p className="text-tertiary text-sm">{description}</p>}
      </div>

      {badgeTrailing ? (
        isValidElement(badgeTrailing) ? (
          badgeTrailing
        ) : (
          <Badge color="brand" size="sm">
            {badgeTrailing}
          </Badge>
        )
      ) : null}
      {contentTrailing}
    </div>
  );
};

interface TableRootProps
  extends AriaTableProps, Omit<ComponentPropsWithRef<'table'>, 'className' | 'slot' | 'style'> {
  size?: TableSize;
}

const TableRoot = ({ className, size = 'md', ...props }: TableRootProps) => {
  const context = useContext(TableContext);

  return (
    <TableContext.Provider value={{ size: context?.size ?? size }}>
      <div className="overflow-x-auto">
        <AriaTable
          className={(state) =>
            cx(
              'w-full overflow-x-hidden',
              typeof className === 'function' ? className(state) : className
            )
          }
          {...props}
        />
      </div>
    </TableContext.Provider>
  );
};
TableRoot.displayName = 'Table';

interface TableHeaderProps<T extends object>
  extends
    AriaTableHeaderProps<T>,
    Omit<ComponentPropsWithRef<'thead'>, 'children' | 'className' | 'slot' | 'style'> {
  bordered?: boolean;
}

const TableHeader = <T extends object>({
  columns,
  children,
  bordered = true,
  className,
  ...props
}: TableHeaderProps<T>) => {
  const { size } = useContext(TableContext);
  const { selectionBehavior, selectionMode } = useTableOptions();

  return (
    <AriaTableHeader
      {...props}
      className={(state) =>
        cx(
          'bg-secondary relative',
          size === 'xs' ? 'h-7' : size === 'sm' ? 'h-9' : 'h-11',

          // Row border—using an "after" pseudo-element to avoid the border taking up space.
          bordered &&
            '[&>tr>th]:after:bg-border-secondary [&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:focus-visible:after:bg-transparent',

          typeof className === 'function' ? className(state) : className
        )
      }
    >
      {selectionBehavior === 'toggle' && (
        <AriaColumn
          className={cx(
            'relative py-2 pr-0 pl-4',
            size === 'xs' ? 'w-7 md:pl-4' : size === 'sm' ? 'w-9 md:pl-5' : 'w-11 md:pl-6'
          )}
        >
          {selectionMode === 'multiple' && (
            <div className="flex items-start">
              <Checkbox slot="selection" size={size === 'xs' ? 'sm' : size} />
            </div>
          )}
        </AriaColumn>
      )}
      <AriaCollection items={columns}>{children}</AriaCollection>
    </AriaTableHeader>
  );
};

TableHeader.displayName = 'TableHeader';

interface TableHeadProps
  extends
    AriaColumnProps,
    Omit<ThHTMLAttributes<HTMLTableCellElement>, 'children' | 'className' | 'style' | 'id'> {
  label?: string;
  tooltip?: string;
}

const TableHead = ({ className, tooltip, label, children, ...props }: TableHeadProps) => {
  const { size } = useContext(TableContext);
  const { selectionBehavior } = useTableOptions();

  return (
    <AriaColumn
      {...props}
      className={(state) =>
        cx(
          'focus-visible:ring-focus-ring focus-visible:ring-offset-bg-primary relative p-0 py-2 outline-hidden focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-inset',
          size === 'xs' ? 'px-4' : size === 'sm' ? 'px-5' : 'px-6',
          selectionBehavior === 'toggle' && 'nth-2:pl-3',
          state.allowsSorting && 'cursor-pointer',
          typeof className === 'function' ? className(state) : className
        )
      }
    >
      {(state) => (
        <AriaGroup className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {label && (
              <span className="text-quaternary text-xs font-semibold whitespace-nowrap">
                {label}
              </span>
            )}
            {typeof children === 'function' ? children(state) : children}
          </div>

          {tooltip && <TooltipIcon title={tooltip} color="quaternary" />}

          {state.allowsSorting &&
            (state.sortDirection ? (
              <ArrowDown
                className={cx(
                  'text-fg-quaternary size-3 stroke-[3px]',
                  state.sortDirection === 'ascending' && 'rotate-180'
                )}
              />
            ) : (
              <ChevronSelectorVertical size={12} strokeWidth={3} className="text-fg-quaternary" />
            ))}
        </AriaGroup>
      )}
    </AriaColumn>
  );
};
TableHead.displayName = 'TableHead';

interface TableRowProps<T extends object>
  extends
    AriaRowProps<T>,
    Omit<
      ComponentPropsWithRef<'tr'>,
      'children' | 'className' | 'onClick' | 'slot' | 'style' | 'id'
    > {
  highlightSelectedRow?: boolean;
}

const TableRow = <T extends object>({
  columns,
  children,
  className,
  highlightSelectedRow = true,
  ...props
}: TableRowProps<T>) => {
  const { size } = useContext(TableContext);
  const { selectionBehavior } = useTableOptions();

  return (
    <AriaRow
      {...props}
      className={(state) =>
        cx(
          'outline-focus-ring hover:bg-secondary relative transition-colors after:pointer-events-none focus-visible:outline-2 focus-visible:-outline-offset-2',
          size === 'xs' ? 'h-12' : size === 'sm' ? 'h-14' : 'h-18',
          highlightSelectedRow && 'selected:bg-secondary',

          // Row border—using an "after" pseudo-element to avoid the border taking up space.
          '[&>td]:after:bg-border-secondary [&>td]:after:absolute [&>td]:after:inset-x-0 [&>td]:after:bottom-0 [&>td]:after:h-px [&>td]:after:w-full last:[&>td]:after:hidden [&>td]:focus-visible:after:opacity-0',

          typeof className === 'function' ? className(state) : className
        )
      }
    >
      {selectionBehavior === 'toggle' && (
        <AriaCell
          className={cx(
            'relative py-2 pr-0 pl-4',
            size === 'xs' ? 'md:pl-4' : size === 'sm' ? 'md:pl-5' : 'md:pl-6'
          )}
        >
          <div className="flex items-end">
            <Checkbox slot="selection" size={size === 'xs' ? 'sm' : size} />
          </div>
        </AriaCell>
      )}
      <AriaCollection items={columns}>{children}</AriaCollection>
    </AriaRow>
  );
};

TableRow.displayName = 'TableRow';

interface TableCellProps
  extends
    AriaCellProps,
    Omit<TdHTMLAttributes<HTMLTableCellElement>, 'children' | 'className' | 'style' | 'id'> {
  ref?: Ref<HTMLTableCellElement>;
}

const TableCell = ({ className, children, ...props }: TableCellProps) => {
  const { size } = useContext(TableContext);
  const { selectionBehavior } = useTableOptions();

  return (
    <AriaCell
      {...props}
      className={(state) =>
        cx(
          'text-tertiary outline-focus-ring relative text-sm focus-visible:z-1 focus-visible:outline-2 focus-visible:-outline-offset-2',
          size === 'xs' && 'px-4 py-2',
          size === 'sm' && 'px-5 py-3',
          size === 'md' && 'px-6 py-4',

          selectionBehavior === 'toggle' && 'nth-2:pl-3',

          typeof className === 'function' ? className(state) : className
        )
      }
    >
      {children}
    </AriaCell>
  );
};
TableCell.displayName = 'TableCell';

const TableCard = {
  Root: TableCardRoot,
  Header: TableCardHeader,
};

const Table = TableRoot as typeof TableRoot & {
  Body: typeof AriaTableBody;
  Cell: typeof TableCell;
  Head: typeof TableHead;
  Header: typeof TableHeader;
  Row: typeof TableRow;
};
Table.Body = AriaTableBody;
Table.Cell = TableCell;
Table.Head = TableHead;
Table.Header = TableHeader;
Table.Row = TableRow;

export { Table, TableCard };
