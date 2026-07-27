import { ProgressBar } from '@/components/base/progress-indicators/progress-indicators';
import { SidebarCard } from './SidebarCard';
import { Button } from '@/components/base/buttons/button';
import { AlertTriangle, ArrowsUp } from '@untitledui/icons';
import { usePrivateLayoutContext } from '../../PrivateLayoutContext';
import { useMemo } from 'react';
import { TRIAL_DURATION_DAYS } from '@/libs/subscriptions';
import dayjs from 'dayjs';

export const TRIAL_SIDEBAR_CARD_ID = 'trial-sidebar-card';

export const TrialSidebarCard = ({ onClose }: { onClose: () => void }) => {
  const { currentProject } = usePrivateLayoutContext();

  const [daysLeft, progress] = useMemo(() => {
    if (!currentProject) return [0, 0];
    const daysPassed = dayjs().diff(dayjs(currentProject.created_at), 'day');
    const daysLeft = Math.max(0, TRIAL_DURATION_DAYS - daysPassed);
    const progress = Math.min(100, (daysPassed / TRIAL_DURATION_DAYS) * 100);
    return [daysLeft, progress];
  }, [currentProject]);

  if (!currentProject) return null;

  return (
    <SidebarCard
      title={daysLeft ? 'Free Trial' : 'Trial Ended'}
      icon={daysLeft ? <ArrowsUp size={16} /> : <AlertTriangle size={16} />}
      description={
        (daysLeft ? `${daysLeft} Days Left. ` : '') +
        'Upgrade now to continue using AllSearch and unlock all features.'
      }
      onClose={onClose}
    >
      {!!daysLeft && <ProgressBar value={progress} />}
      <Button color={daysLeft ? 'secondary' : 'primary-destructive'} size="sm" onClick={() => {}}>
        Subscribe Now
      </Button>
    </SidebarCard>
  );
};
