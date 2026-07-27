'use client';

import { EmptyState as EmptyStateBase } from '@/components/application/empty-state/empty-state';
import { Button } from '@/components/base/buttons/button';
import { ROUTES } from '@/libs/routes';
import { userSignOut } from '@/libs/database/supabase/client';
import { useRouter } from 'next/navigation';
import { FolderCheck } from '@untitledui/icons';

export default function DashboardEmptyState() {
  const router = useRouter();

  const onSignOut = async () => {
    await userSignOut();
    router.push(ROUTES.HOME);
  };

  return (
    <EmptyStateBase size="lg" className="pt-50 pb-25">
      <EmptyStateBase.Header>
        <EmptyStateBase.FeaturedIcon icon={FolderCheck} color="gray" />
      </EmptyStateBase.Header>

      <EmptyStateBase.Content>
        <EmptyStateBase.Title>No active projects</EmptyStateBase.Title>
        <EmptyStateBase.Description>
          All your projects have been archived. Create a new project to get started again, or sign
          out.
        </EmptyStateBase.Description>
      </EmptyStateBase.Content>

      <EmptyStateBase.Footer>
        <Button size="md" color="secondary" onClick={onSignOut}>
          Sign out
        </Button>
        <Button size="md" color="primary" href={ROUTES.NEW_PROJECT.INDEX}>
          New project
        </Button>
      </EmptyStateBase.Footer>
    </EmptyStateBase>
  );
}
