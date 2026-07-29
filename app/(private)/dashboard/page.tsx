import { Metadata } from 'next';
import { getOrganization } from '@/libs/database/Organizations/queries';
import { redirect } from 'next/navigation';
import { RouteHelper } from '@/libs/routes';
import { getProjectRows } from '@/libs/database/Projects/queries';
import { MainContainer } from '../components/Containers';
import Header from '../components/Header';
import DashboardEmptyState from './DashboardEmptyState';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const organization = await getOrganization();
  if (!organization) throw new Error('Organization not found');

  // If there are active projects, redirect to the first one
  const projects = await getProjectRows();
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
