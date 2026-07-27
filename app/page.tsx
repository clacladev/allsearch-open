import { redirect } from 'next/navigation';
import { ROUTES } from '@/libs/routes';

export default function Home() {
  redirect(ROUTES.DASHBOARD);
}
