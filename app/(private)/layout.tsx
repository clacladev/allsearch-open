import { ReactNode } from 'react';
import { PrivateLayoutContextProvider } from './components/PrivateLayoutContext';
import { EventContextProvider } from './components/EventContext';
import { Sidebar } from './components/Sidebar/Sidebar';
import ClientLayout from '@/components/ClientLayout';
import { getProjectRows } from '@/libs/database/Projects/queries';
import { getOrganization } from '@/libs/database/Organizations/queries';
import { getCompetitorRowsWithProjectId } from '@/libs/database/Competitors/queries';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import { getPromptRowsWithProjectId } from '@/libs/database/Prompts/queries';
import { MessagesContextProvider } from './components/MessagesContext';

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const organization = await getOrganization();
  if (!organization) redirect(ROUTES.ORGANIZATION);

  const projects = await getProjectRows(true);
  if (!projects.length) redirect(ROUTES.NEW_PROJECT.INDEX);

  const [competitorsByProject, promptsByProject] = await Promise.all([
    Promise.all(projects.map((project) => getCompetitorRowsWithProjectId(project.id))),
    Promise.all(projects.map((project) => getPromptRowsWithProjectId(project.id, true))),
  ]);
  const competitors = competitorsByProject.flat();
  const prompts = promptsByProject.flat();

  const activeProjects = projects.filter((project) => !project.is_archived);

  return (
    <body className="bg-primary antialiased">
      <ClientLayout>
        <MessagesContextProvider>
          <PrivateLayoutContextProvider
            initialValues={{
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
