import { cn } from '@/libs/utils/cn';

export default function ContentContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-4xl space-y-10 p-4 pb-24', className)}>{children}</div>
  );
}
