'use client';

import { MainContainer } from '@/app/(private)/components/Containers';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CircleAlert } from 'lucide-react';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <MainContainer>
      <Alert variant="destructive" className="mt-8">
        <CircleAlert aria-hidden="true" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>An error occurred while loading this page.</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline" onClick={reset}>
            Try again
          </Button>
        </AlertAction>
      </Alert>
    </MainContainer>
  );
}
