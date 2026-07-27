import { UserRole } from '@/libs/database/UserProfiles/types';
import { RouteHelper } from '@/libs/routes';

type Tab = {
  id: string;
  label: string;
  getRoute: (projectId: string) => string;
  userRole: UserRole;
};

export const SETTINGS_TABS: Tab[] = [
  {
    id: 'competitors',
    label: 'Competitors',
    getRoute: (projectId: string) => RouteHelper.Project.Settings.getCompetitors(projectId),
    userRole: 'user',
  },
  {
    id: 'brand',
    label: 'Brand',
    getRoute: (projectId: string) => RouteHelper.Project.Settings.getBrand(projectId),
    userRole: 'user',
  },
  {
    id: 'organization',
    label: 'Organization',
    getRoute: (projectId: string) => RouteHelper.Project.Settings.getOrganization(projectId),
    userRole: 'user',
  },
  {
    id: 'others',
    label: 'Others',
    getRoute: (projectId: string) => RouteHelper.Project.Settings.getOthers(projectId),
    userRole: 'user',
  },
  {
    id: 'admin-tools',
    label: 'Admin Tools',
    getRoute: (projectId: string) => RouteHelper.Project.Settings.getAdminTools(projectId),
    userRole: 'admin',
  },
];

type Competitor = {
  name: string | null | undefined;
  url: string;
};

export const isDuplicateUrl = (url: string, items: Competitor[]) =>
  items.some((item) => item.url === url);

export const isDuplicateName = (name: string, items: Competitor[]) =>
  !!name && items.some((item) => item.name === name);

export const isCompetitorUnique = (
  competitors: Competitor[],
  name: string | null | undefined,
  url: string
) =>
  !competitors.some((competitor) => (!!name && competitor.name === name) || competitor.url === url);
