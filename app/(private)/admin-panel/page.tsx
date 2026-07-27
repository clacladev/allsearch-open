import { Metadata } from 'next';
import { MainContainer } from '../components/Containers';
import Header from '../components/Header';
import { Shield01 } from '@untitledui/icons';
import { getUserOrThrow } from '@/libs/database/supabase/server';
import { getUserProfileRowWithId } from '@/libs/database/UserProfiles/queries';
import { getProjectRowsAll } from '@/libs/database/Projects/queries';
import { getUserSessionInfoRows } from '@/libs/database/UserSessions/queries';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/libs/routes';
import AdminPanelSections, { type UsersInfoMap } from './components/AdminPanelSections';

export const metadata: Metadata = { title: 'Admin Panel' };

export default async function AdminPanelPage() {
  const user = await getUserOrThrow();
  const userProfile = await getUserProfileRowWithId(user.id);
  if (!userProfile) throw new Error('User profile not found');
  if (userProfile.role !== 'admin') redirect(ROUTES.DASHBOARD);

  const allProjects = await getProjectRowsAll(true, {
    fields: ['id', 'name', 'hostname', 'is_paused', 'is_archived', 'author_id', 'created_at'],
    asAdmin: true,
  });
  allProjects.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const authorIds = [...new Set(allProjects.map((p) => p.author_id))];
  const sessionInfoRows = await getUserSessionInfoRows(authorIds);

  const usersInfo: UsersInfoMap = {};
  for (const row of sessionInfoRows) {
    usersInfo[row.id] = { email: row.email, lastActiveAt: row.last_active_at };
  }

  return (
    <MainContainer>
      <Header text="Admin Panel" icon={Shield01} />
      <AdminPanelSections initialProjects={allProjects} usersInfo={usersInfo} />
    </MainContainer>
  );
}
