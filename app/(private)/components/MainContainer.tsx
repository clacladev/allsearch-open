import { cx } from '@/utils/cx';

export default function ContentContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx('mx-auto w-full max-w-4xl space-y-10 p-4 pb-24', className)}>{children}</div>
  );
}
