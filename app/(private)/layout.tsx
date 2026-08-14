import { ReactNode } from 'react';
import { PrivateLayoutContextProvider } from './components/PrivateLayoutContext';
import { EventContextProvider } from './components/EventContext';
import { ApplicationShell } from '@/components/shared/application-navigation/ApplicationShell';
import ClientLayout from '@/components/ClientLayout';
import { getProjectRows } from '@/libs/database/Projects/queries';
import { getOrganization } from '@/libs/database/Organizations/queries';
import { getCompetitorRowsWithProjectId } from '@/libs/database/Competitors/queries';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import { getPromptRowsWithProjectId } from '@/libs/database/Prompts/queries';
import { MessagesContextProvider } from './components/MessagesContext';
import { CollectionRunProgressBar } from '@/components/collection-run/CollectionRunProgressBar';
import { CollectionRunProvider } from '@/components/collection-run/CollectionRunContext';
import { CollectionCadenceSurfaces } from '@/components/collection-run/CollectionCadenceSurfaces';
import { CollectionCadenceSidebarCard } from './components/Sidebar/Cards/CollectionCadenceSidebarCard';

// This app has no user identity, so nothing here reads a session cookie or other
// dynamic API — the signal that used to force per-request rendering implicitly.
// Every page in this group reads the per-install SQLite database, so without this
// export Next.js would statically prerender them at build time (against whatever
// database exists then) and freeze that snapshot into the served HTML forever.
export const dynamic = 'force-dynamic';

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
              <CollectionRunProvider>
                <ApplicationShell
                  footer={<CollectionCadenceSidebarCard hasProjects={activeProjects.length > 0} />}
                />
                <div style={{ paddingBottom: 'var(--collection-run-bar-height, 0px)' }}>
                  {children}
                </div>
                <CollectionRunProgressBar />
                <CollectionCadenceSurfaces hasProjects={activeProjects.length > 0} />
              </CollectionRunProvider>
            </EventContextProvider>
          </PrivateLayoutContextProvider>
        </MessagesContextProvider>
      </ClientLayout>
    </body>
  );
}
