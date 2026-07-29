import CompetitorsForm from './CompetitorsForm';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Project - Competitors' };

export default async function CompetitorsPage() {
  return <CompetitorsForm />;
}
