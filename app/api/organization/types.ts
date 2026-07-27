import { OrganizationType } from '@/libs/database/Organizations/types';
import { z } from 'zod';

export const OrganizationTypeSchema = z.enum(OrganizationType);

export const OrganizationSchema = z.object({
  type: OrganizationTypeSchema,
  url: z.string().optional(),
  name: z.string().optional(),
  iconUrl: z.string().optional(),
});

export type UpdateOrganizationResponse = {
  organizationId: string;
  isUpdate: boolean;
};
