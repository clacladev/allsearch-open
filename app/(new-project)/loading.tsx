import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';

export default function Loading() {
  return (
    <div className="mx-auto flex h-full w-full justify-center">
      <LoadingIndicator label="Loading..." />
    </div>
  );
}
