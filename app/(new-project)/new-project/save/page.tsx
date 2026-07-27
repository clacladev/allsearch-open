import { Metadata } from 'next';
import SaveProject from './SaveProject';

export const metadata: Metadata = { title: 'New Project - Save' };

export default async function SaveProjectPage() {
  return <SaveProject />;
}
