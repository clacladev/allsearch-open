'use client';

import { type FC, type ReactNode, useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/libs/utils/cn';
import { ProjectStatusIndicator, type ProjectStatus } from './ProjectStatusIndicator';

type ProjectIconSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ProjectIconProps {
  size?: ProjectIconSize;
  className?: string;
  src?: string | null;
  alt?: string;
  /**
   * Display a contrast border around the avatar.
   */
  contrastBorder?: boolean;
  /**
   * Display a badge (i.e. company logo).
   */
  badge?: ReactNode;
  /**
   * Display a status indicator.
   */
  status?: ProjectStatus;
  /**
   * Display a verified tick icon.
   *
   * @default false
   */
  verified?: boolean;

  /**
   * The initials of the user to display if no image is available.
   */
  initials?: string;
  /**
   * An icon to display if no image is available.
   */
  placeholderIcon?: FC<{ className?: string }>;
  /**
   * A placeholder to display if no image is available.
   */
  placeholder?: ReactNode;

  /**
   * Whether the avatar should show a focus ring when the parent group is in focus.
   * For example, when the avatar is wrapped inside a link.
   *
   * @default false
   */
  focusable?: boolean;

  /**
   * A CSS color value applied as the background when showing the fallback
   * (initials / placeholder icon). Useful for brand-specific colors.
   */
  color?: string;
}

const styles = {
  xxs: {
    root: 'size-4 outline-[0.5px] -outline-offset-[0.5px]',
    initials: 'text-xs font-semibold',
    icon: 'size-3',
    iconSizePx: 12,
  },
  xs: {
    root: 'size-6 outline-[0.5px] -outline-offset-[0.5px]',
    initials: 'text-xs font-semibold',
    icon: 'size-4',
    iconSizePx: 16,
  },
  sm: {
    root: 'size-8 outline-[0.75px] -outline-offset-[0.75px]',
    initials: 'text-sm font-semibold',
    icon: 'size-5',
    iconSizePx: 20,
  },
  md: {
    root: 'size-10 outline-1 -outline-offset-1',
    initials: 'text-md font-semibold',
    icon: 'size-6',
    iconSizePx: 24,
  },
  lg: {
    root: 'size-12 outline-1 -outline-offset-1',
    initials: 'text-lg font-semibold',
    icon: 'size-7',
    iconSizePx: 28,
  },
  xl: {
    root: 'size-14 outline-1 -outline-offset-1',
    initials: 'text-xl font-semibold',
    icon: 'size-8',
    iconSizePx: 32,
  },
  '2xl': {
    root: 'size-16 outline-1 -outline-offset-1',
    initials: 'text-display-xs font-semibold',
    icon: 'size-8',
    iconSizePx: 36,
  },
};

export const ProjectIcon = ({
  contrastBorder = true,
  size = 'md',
  src,
  alt,
  initials,
  placeholder,
  placeholderIcon: PlaceholderIcon,
  badge,
  status,
  focusable = false,
  color,
  className,
}: ProjectIconProps) => {
  const [isFailed, setIsFailed] = useState(false);

  const renderMainContent = () => {
    if (src && !isFailed) {
      return (
        <img
          data-project-logo
          className="size-full rounded object-cover"
          width={styles[size].iconSizePx * 2}
          height={styles[size].iconSizePx * 2}
          src={src}
          alt={alt ?? 'Project icon'}
          onError={() => setIsFailed(true)}
        />
      );
    }

    if (initials) {
      return <span className={cn('text-quaternary', styles[size].initials)}>{initials}</span>;
    }

    if (PlaceholderIcon) {
      return <PlaceholderIcon className={cn('text-fg-quaternary', styles[size].icon)} />;
    }

    return placeholder || <User className={cn('text-fg-quaternary', styles[size].icon)} />;
  };

  const renderBadgeContent = () => {
    if (status) {
      return <ProjectStatusIndicator status={status} size={size === 'xxs' ? 'xs' : size} />;
    }

    return badge;
  };

  const isFallback = !src || isFailed;
  const fallbackStyle =
    color && isFallback ? { backgroundColor: color, color: 'white' } : undefined;

  return (
    <div
      data-avatar
      style={fallbackStyle}
      className={cn(
        'bg-primary text-tertiary relative inline-flex shrink-0 items-center justify-center rounded text-xs outline-transparent dark:bg-neutral-100',
        // Focus styles
        focusable &&
          'group-outline-focus-ring group-focus-visible:outline-2 group-focus-visible:outline-offset-2',
        contrastBorder && 'outline-avatar-contrast-border outline',
        styles[size].root,
        className
      )}
    >
      {renderMainContent()}
      {renderBadgeContent()}
    </div>
  );
};
