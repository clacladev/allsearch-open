import { Metadata } from 'next';
import PromptsForm from './PromptsForm';

export const metadata: Metadata = { title: 'New Project - Prompts' };

export default async function PromptsPage() {
  return <PromptsForm />;
}
