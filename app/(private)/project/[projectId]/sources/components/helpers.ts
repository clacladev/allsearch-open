import { DomainCategory } from '@/libs/utils/project-analysis/domain-categories';
import { BadgeColors } from '@/components/base/badges/badge-types';

export const DOMAIN_CATEGORIES_COLORS: Record<DomainCategory, BadgeColors> = {
  You: 'blue',
  UGC: 'orange',
  Institutional: 'pink',
  Editorial: 'purple',
  Other: 'gray',
};
