import { DomainCategory } from '@/libs/utils/project-analysis/domain-categories';

export const DOMAIN_CATEGORY_DOT_CLASS: Record<DomainCategory, string> = {
  You: 'bg-blue-500',
  UGC: 'bg-orange-500',
  Institutional: 'bg-pink-500',
  Editorial: 'bg-purple-500',
  Other: 'bg-gray-500',
};
