import { cn } from '@/libs/utils/cn';

export default function SmallProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      aria-label={`${value}%`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={value}
      role="progressbar"
      className={cn('h-2 w-12 overflow-hidden rounded-md bg-quaternary', className)}
    >
      <div
        className="size-full rounded-md bg-fg-brand-primary transition duration-75 ease-linear"
        style={{ transform: `translateX(-${100 - boundedValue}%)` }}
      />
    </div>
  );
}
