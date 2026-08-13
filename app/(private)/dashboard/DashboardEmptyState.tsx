'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/libs/routes';
import { FolderCheck } from 'lucide-react';

export default function DashboardEmptyState() {
  return (
    <Card className="mx-auto mt-24 w-full max-w-xl text-center" size="sm">
      <CardHeader className="justify-items-center">
        <FolderCheck className="text-muted-foreground size-10" aria-hidden="true" />
        <CardTitle>No active projects</CardTitle>
        <CardDescription>
          All your projects have been archived. Create a new project to get started again.
        </CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter className="justify-center">
        <Button nativeButton={false} render={<a href={ROUTES.NEW_PROJECT.INDEX} />}>
          New project
        </Button>
      </CardFooter>
    </Card>
  );
}
