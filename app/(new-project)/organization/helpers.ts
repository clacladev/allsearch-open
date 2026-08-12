import { OrganizationType } from '@/libs/database/Organizations/types';

export type OrganizationTypeOption = {
  value: OrganizationType;
  title: string;
  description: string;
};

export const ORGANIZATION_TYPES: OrganizationTypeOption[] = [
  {
    value: OrganizationType.Agency,
    title: 'Agency',
    description: 'I manage multiple brands or clients.',
  },
  {
    value: OrganizationType.InHouse,
    title: 'In-house',
    description: "I manage my company's brand.",
  },
];
