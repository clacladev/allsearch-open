import { ProgressBarBase } from '@/components/base/progress-indicators/progress-indicators';
import { cx } from '@/utils/cx';

export default function SmallProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <ProgressBarBase min={0} max={100} value={value} className={cx('block w-12', className)} />
  );
}
