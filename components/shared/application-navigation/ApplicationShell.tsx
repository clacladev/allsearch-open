'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Activity, ArrowLeft, Building2, Globe2, Home, KeyRound, MessageCircle, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { RouteHelper, ROUTES } from '@/libs/routes';
import { useDateRangeParams } from '@/hooks/useDateRangeParams';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { NavigationMenu } from './NavigationMenu';
import { ProjectSelector } from './ProjectSelector';
import { MobileNavigation } from './MobileNavigation';
import type { NavigationItem } from './navigation-types';
import { ThemeToggleCompactButton } from '@/components/ThemeToggleButton';

export function ApplicationShell({ footer }: { footer?: ReactNode }) {
 const pathname = usePathname(); const { projects, currentProject } = usePrivateLayoutContext(); const { startDate, endDate } = useDateRangeParams();
 const items = useMemo<NavigationItem[]>(() => pathname.startsWith('/project') && currentProject ? [
  { label: 'Overview', href: RouteHelper.Project.getOverview(currentProject.id, startDate, endDate), icon: Home }, { label: 'Sources', href: RouteHelper.Project.getSourcesContents(currentProject.id, startDate, endDate), icon: Globe2 }, { label: 'Opportunities', href: RouteHelper.Project.getOpportunities(currentProject.id, startDate, endDate), icon: Activity }, { label: 'Prompts', href: RouteHelper.Project.getPrompts(currentProject.id, startDate, endDate), icon: MessageCircle }, { label: 'Brands', href: RouteHelper.Project.getBrands(currentProject.id, startDate, endDate), icon: Building2 }, { label: 'Crawl health', href: RouteHelper.Project.getCrawlHealth(currentProject.id), icon: KeyRound }, { label: 'Settings', href: RouteHelper.Project.getSettings(currentProject.id), icon: Settings },
 ] : [{ label: 'Back to Dashboard', href: ROUTES.DASHBOARD, icon: ArrowLeft }, { label: 'Settings', href: ROUTES.SETTINGS, icon: Settings }], [currentProject, pathname, startDate, endDate]);
 const projectsForNav = projects?.map((project) => ({ id: project.id, name: project.name, url: project.url, hostname: project.hostname, iconUrl: project.icon_url || undefined, status: project.is_paused ? 'paused' as const : 'running' as const })) ?? [];
 const content = <aside className="flex h-full w-full max-w-full flex-col justify-between overflow-auto bg-background pt-4 lg:w-72 lg:pt-6"><div className="flex flex-col gap-5 px-4 lg:px-5"><ProjectSelector selectedProjectId={currentProject?.id} projects={projectsForNav} /></div><NavigationMenu items={items} pathname={pathname} /><div className="mt-auto flex flex-col gap-4 px-2 py-4 lg:px-4 lg:py-6" style={{ paddingBottom: 'var(--collection-run-bar-height, 0px)' }}><ThemeToggleCompactButton /><>{footer}</></div></aside>;
 return <><MobileNavigation>{content}</MobileNavigation><div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex">{content}</div><div className="hidden w-72 shrink-0 lg:block" aria-hidden="true" /></>;
}
