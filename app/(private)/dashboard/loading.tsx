import { MainContainer } from '@/app/(private)/components/Containers';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <MainContainer>
      <div
        className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 py-12"
        aria-label="Loading dashboard"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </MainContainer>
  );
}
