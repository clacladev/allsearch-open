'use client';

import { MainContainer } from '@/app/(private)/components/Containers';
import { EmptyState } from '@/app/(private)/components/EmptyState';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <MainContainer>
      <EmptyState
        title="Something went wrong"
        description="An error occurred while loading this page."
        customActionTitle="Try again"
        customAction={reset}
      />
    </MainContainer>
  );
}
