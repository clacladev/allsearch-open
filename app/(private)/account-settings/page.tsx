import { Metadata } from 'next';
import AccountSettings from './AccountSettings';
import { MainContainer } from '../components/Containers';
import Header from '../components/Header';
import { Settings02 } from '@untitledui/icons';
import { getUser } from '@/libs/database/supabase/server';

export const metadata: Metadata = { title: 'Account Settings' };

export default async function AccountSettingsPage() {
  const user = await getUser();
  if (!user?.email) throw new Error('No user found');
  return (
    <MainContainer>
      <Header text="Account Settings" icon={Settings02} />
      <AccountSettings userEmail={user.email} />
    </MainContainer>
  );
}
