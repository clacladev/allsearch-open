'use client';

import { SidebarCard } from './SidebarCard';
import { Button } from '@/components/ui/button';
import { useCollectionCadence } from '@/components/collection-run/useCollectionCadence';

export function CollectionCadenceSidebarCard({ hasProjects }: { hasProjects: boolean }) {
  const { cadenceState, triggerRefresh, isRefreshing } = useCollectionCadence(hasProjects);

  if (cadenceState.kind !== 'countdown') return null;

  return (
    <SidebarCard
      title={`Next update in ${cadenceState.daysRemaining} day${cadenceState.daysRemaining === 1 ? '' : 's'}`}
    >
      <Button size="sm" variant="secondary" disabled={isRefreshing} onClick={() => triggerRefresh()}>
        Refresh now
      </Button>
    </SidebarCard>
  );
}
