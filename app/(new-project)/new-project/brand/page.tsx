import BrandForm from './BrandForm';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Project - Brand' };

export default async function BrandPage() {
  return <BrandForm />;
}
