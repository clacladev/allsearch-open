import { ReactNode } from 'react';
import PublicShell from './components/PublicShell';

export default async function LayoutPublic({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
