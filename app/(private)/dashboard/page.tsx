import { getUserOrRedirectToSignin } from '@/libs/database/supabase/server';
import { Metadata } from 'next';
import { getOrganizationRowWithOwnerId } from '@/libs/database/Organizations/queries';
import { redirect } from 'next/navigation';
import { RouteHelper } from '@/libs/routes';
import { getProjectsRowsWithOrganizationId } from '@/libs/database/Projects/queries';
import { MainContainer } from '../components/Containers';
import Header from '../components/Header';
import DashboardEmptyState from './DashboardEmptyState';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await getUserOrRedirectToSignin();
  const organization = await getOrganizationRowWithOwnerId(user.id);
  if (!organization) throw new Error('Organization not found');

  // If there are active projects, redirect to the first one
  const projects = await getProjectsRowsWithOrganizationId(organization.id);
  if (!!projects.length) {
    return redirect(RouteHelper.Project.getOverview(projects[0].id));
  }

  // Otherwise, since there are archived projects, it's not a new user
  return (
    <MainContainer>
      <Header text="Dashboard" />
      <DashboardEmptyState />
    </MainContainer>
  );
}
