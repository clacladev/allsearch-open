import TopicsForm from './TopicsForm';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Project - Topics' };

export default async function TopicsPage() {
  return <TopicsForm />;
}
