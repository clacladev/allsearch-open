import { cn } from '@/libs/utils/cn';

export default function SmallProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return <div aria-label={`${value}%`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={value} role="progressbar" className={cn('h-1.5 w-12 overflow-hidden rounded-full bg-muted', className)}><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
