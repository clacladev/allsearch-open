'use client';

import {
  ActivityHeart,
  ArrowLeft,
  Building06,
  Globe01,
  Home02,
  MessageCircle01,
  Settings02,
} from '@untitledui/icons';
import type { NavItemType } from '@/components/application/app-navigation/config';
import { usePathname } from 'next/navigation';
import {
  ProjectSelectorCard,
  NavProjectType,
} from '@/app/(private)/components/project/ProjectSelectorCard';
import { useMemo, type ReactNode } from 'react';
import { cx } from '@/utils/cx';
import Link from 'next/link';
import { RouteHelper, ROUTES } from '@/libs/routes';
import { NavList } from '@/components/application/app-navigation/base-components/nav-list';
import { NavItemBase } from '@/components/application/app-navigation/base-components/nav-item';
import { MobileNavigationHeader } from '@/components/application/app-navigation/base-components/mobile-header';
import { AppLogo } from '@/components/AppLogo';
import { usePrivateLayoutContext } from '../PrivateLayoutContext';
import { BOOK_DEMO_SIDEBAR_CARD_ID, BookDemoSidebarCard } from './Cards/BookDemoSidebarCard';
import { HIDE_MESSAGE_ONE_DAY_MS, useMessagesContext } from '../MessagesContext';
import { useDateRangeParams } from '@/hooks/useDateRangeParams';

export const Sidebar = () => {
  const pathname = usePathname();
  const { projects, currentProject } = usePrivateLayoutContext();
  const { hideMessage, getIsMessageHidden } = useMessagesContext();
  const { startDate, endDate } = useDateRangeParams();

  const navProjects: NavProjectType[] = useMemo(
    () =>
      projects?.map((project) => ({
        id: project.id,
        name: project.name,
        url: project.url,
        hostname: project.hostname,
        iconUrl: project.icon_url || undefined,
        status: project.is_paused ? 'paused' : 'running',
      })) ?? [],
    [projects]
  );

  const navItems: NavItemType[] = useMemo(() => {
    if (pathname.startsWith('/project')) {
      return currentProject
        ? [
            {
              label: 'Overview',
              href: RouteHelper.Project.getOverview(currentProject.id, startDate, endDate),
              icon: Home02,
            },
            {
              label: 'Sources',
              href: RouteHelper.Project.getSourcesContents(currentProject.id, startDate, endDate),
              icon: Globe01,
            },
            {
              label: 'Opportunities',
              href: RouteHelper.Project.getOpportunities(currentProject.id, startDate, endDate),
              icon: ActivityHeart,
            },
            {
              label: 'Prompts',
              href: RouteHelper.Project.getPrompts(currentProject.id, startDate, endDate),
              icon: MessageCircle01,
            },
            {
              label: 'Brands',
              href: RouteHelper.Project.getBrands(currentProject.id, startDate, endDate),
              icon: Building06,
            },
            {
              label: 'Settings',
              href: RouteHelper.Project.getSettings(currentProject.id),
              icon: Settings02,
            },
          ]
        : [];
    }

    // Default case
    return [
      {
        label: 'Back to Dashboard',
        href: ROUTES.DASHBOARD,
        icon: ArrowLeft,
      },
      {
        label: 'Settings',
        href: ROUTES.SETTINGS,
        icon: Settings02,
      },
    ];
  }, [currentProject, pathname, startDate, endDate]);

  return (
    <SidebarNavigationSimple
      activeUrl={pathname}
      items={navItems}
      logo={<ProjectSelectorCard selectedProjectId={currentProject?.id} projects={navProjects} />}
      cards={[
        !getIsMessageHidden(BOOK_DEMO_SIDEBAR_CARD_ID) && (
          <BookDemoSidebarCard
            key={BOOK_DEMO_SIDEBAR_CARD_ID}
            onClose={() => hideMessage(BOOK_DEMO_SIDEBAR_CARD_ID, HIDE_MESSAGE_ONE_DAY_MS)}
          />
        ),

        // TODO: Cleanup when subscription is implemented
        // !hiddenMessagesIds.includes(TRIAL_SIDEBAR_CARD_ID) && (
        //   <TrialSidebarCard
        //     key={TRIAL_SIDEBAR_CARD_ID}
        //     onClose={() => hideMessage(TRIAL_SIDEBAR_CARD_ID)}
        //   />
        // ),
      ]}
      hideBorder
    />
  );
};

interface SidebarNavigationProps {
  /** Url of the currently active item. */
  activeUrl?: string;
  /** List of items to display. */
  items: NavItemType[];
  /** Logo to display. */
  logo?: ReactNode;
  /** List of footer items to display. */
  footerItems?: NavItemType[];
  /** List of cards to display. */
  cards?: ReactNode[];
  /** Whether to hide the right side border. */
  hideBorder?: boolean;
  /** Additional CSS classes to apply to the sidebar. */
  className?: string;
}

const SidebarNavigationSimple = ({
  activeUrl,
  items,
  logo,
  footerItems = [],
  cards,
  hideBorder = false,
  className,
}: SidebarNavigationProps) => {
  const content = (
    <aside
      className={cx(
        'bg-primary flex h-full w-full max-w-full flex-col justify-between overflow-auto pt-4 lg:w-72 lg:pt-6',
        !hideBorder && 'border-secondary md:border-r',
        className
      )}
    >
      <div className="flex flex-col gap-5 px-4 lg:px-5">
        {logo ? (
          logo
        ) : (
          <Link href={ROUTES.DASHBOARD} className="lg:pb-6">
            <AppLogo className="h-8" />
          </Link>
        )}
      </div>

      <NavList activeUrl={activeUrl} items={items} />

      <div
        className="mt-auto flex flex-col gap-4 px-2 py-4 lg:px-4 lg:py-6"
        style={{ paddingBottom: 'var(--collection-run-bar-height, 0px)' }}
      >
        {footerItems.length > 0 && (
          <ul className="flex flex-col">
            {footerItems.map((item) => (
              <li key={item.label} className="py-0.5">
                <NavItemBase
                  badge={item.badge}
                  icon={item.icon}
                  href={item.href}
                  onClick={item.onClick}
                  type="link"
                  current={item.href === activeUrl}
                >
                  {item.label}
                </NavItemBase>
              </li>
            ))}
          </ul>
        )}

        {!!cards?.length && cards.map((card, index) => <div key={`card-${index}`}>{card}</div>)}
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile header navigation */}
      <MobileNavigationHeader>{content}</MobileNavigationHeader>

      {/* Desktop sidebar navigation */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex">{content}</div>

      {/* Placeholder to take up physical space because the real sidebar has `fixed` position. */}
      <div className="invisible hidden pl-72 lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />
    </>
  );
};
