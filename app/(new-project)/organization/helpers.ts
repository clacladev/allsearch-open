import { RadioGroupItemType } from '@/components/base/radio-groups/radio-group-radio-button';
import { OrganizationType } from '@/libs/database/Organizations/types';

export const ORGANIZATION_TYPES: RadioGroupItemType[] = [
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
