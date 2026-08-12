import { AppTooltip } from '@/components/shared/tooltip';
import { cx } from '@/utils/cx';
import { HelpCircle, InfoCircle } from '@untitledui/icons';

export function Tooltip({
  children,
  title,
  description,
  className,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <AppTooltip content={<><span>{title}</span>{description ? <span className="sr-only"> {description}</span> : null}</>}>
      <span className={cx('group relative inline-flex flex-col items-center gap-2 transition duration-100 ease-linear', className)}>{children}</span>
    </AppTooltip>
  );
}

export function TooltipIcon({
  title,
  description,
  variant = 'info',
  color = 'tertiary',
}: {
  title: string;
  description?: string;
  variant?: 'info' | 'question';
  color?: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
}) {
  let Icon = null;
  switch (variant) {
    case 'info':
      Icon = InfoCircle;
      break;
    case 'question':
      Icon = HelpCircle;
      break;
      break;
  }

  return (
    <Tooltip title={title} description={description}>
      <Icon size={14} className={`text-${color}`} />
    </Tooltip>
  );
}
