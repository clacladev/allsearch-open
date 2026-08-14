import { Spinner } from '@/components/ui/spinner';

export function RouteLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-4">
      <Spinner role="presentation" aria-hidden="true" className="size-8" />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
