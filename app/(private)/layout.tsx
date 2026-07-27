import { ReactNode } from 'react';
import { getUserOrRedirectToSignin } from '@/libs/database/supabase/server';
import { PrivateLayoutContextProvider } from './components/PrivateLayoutContext';
import { EventContextProvider } from './components/EventContext';
import { Sidebar } from './components/Sidebar/Sidebar';
import ClientLayout from '../(public)/components/ClientLayout';
import { getProjectsRowsWithOrganizationId } from '@/libs/database/Projects/queries';
import { getOrganizationRowWithOwnerId } from '@/libs/database/Organizations/queries';
import { getUserProfileRowWithId } from '@/libs/database/UserProfiles/queries';
import { getCompetitorRowsWithOrganizationId } from '@/libs/database/Competitors/queries';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import { getPromptRowsWithOrganizationId } from '@/libs/database/Prompts/queries';
import { MessagesContextProvider } from './components/MessagesContext';

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const user = await getUserOrRedirectToSignin();

  const [userProfile, organization] = await Promise.all([
    getUserProfileRowWithId(user.id),
    getOrganizationRowWithOwnerId(user.id),
  ]);
  if (!userProfile) throw new Error('User profile not found');
  if (!organization) redirect(ROUTES.ORGANIZATION);

  const [projects, competitors, prompts] = await Promise.all([
    getProjectsRowsWithOrganizationId(organization.id, true),
    getCompetitorRowsWithOrganizationId(organization.id),
    getPromptRowsWithOrganizationId(organization.id, true),
  ]);
  if (!projects.length) redirect(ROUTES.NEW_PROJECT.INDEX);

  const activeProjects = projects.filter((project) => !project.is_archived);

  return (
    <body className="bg-primary antialiased">
      <ClientLayout>
        <MessagesContextProvider userId={user.id}>
          <PrivateLayoutContextProvider
            initialValues={{
              userProfile,
              organization,
              projects: activeProjects,
              competitors,
              prompts,
            }}
          >
            <EventContextProvider>
              <Sidebar />
              {children}
            </EventContextProvider>
          </PrivateLayoutContextProvider>
        </MessagesContextProvider>
      </ClientLayout>
    </body>
  );
}
