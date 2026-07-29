import { ProjectStatus } from '@/app/(private)/components/project/ProjectSelectorCard';
import { cx } from '@/utils/cx';

const sizes = {
  xs: 'size-1.5',
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3',
  xl: 'size-3.5',
  '2xl': 'size-4',
  '3xl': 'size-4.5',
  '4xl': 'size-5',
};

interface ProjectStatusIndicatorProps {
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  status: ProjectStatus;
  className?: string;
}

const STATUS_COLOR_CLASS = {
  running: 'bg-fg-success-secondary',
  paused: 'bg-fg-warning-secondary',
};

export const ProjectStatusIndicator = ({
  size,
  status,
  className,
}: ProjectStatusIndicatorProps) => (
  <span
    className={cx(
      'ring-bg-primary absolute right-0 bottom-0 rounded-full ring-[1.5px]',
      STATUS_COLOR_CLASS[status],
      sizes[size],
      className
    )}
  />
);
