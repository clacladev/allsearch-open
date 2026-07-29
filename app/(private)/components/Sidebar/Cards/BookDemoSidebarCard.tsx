import { Webcam01 } from '@untitledui/icons';
import { SidebarCard } from './SidebarCard';
import { Button } from '@/components/base/buttons/button';

export const BOOK_DEMO_SIDEBAR_CARD_ID = 'book-demo-sidebar-card';

const CALENDAR_URL = 'https://meetings-eu1.hubspot.com/rmontis';

export const BookDemoSidebarCard = ({ onClose }: { onClose: () => void }) => (
  <SidebarCard
    title="Book SEO Expert Session"
    icon={<Webcam01 size={16} />}
    description="20-min session with our SEO experts to review your account setup and help you define your AI tracking strategy."
    onClose={onClose}
  >
    <Button color="secondary" size="sm" href={CALENDAR_URL} target="_blank">
      Book Session
    </Button>
  </SidebarCard>
);
