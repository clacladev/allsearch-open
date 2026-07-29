import { organizations } from '../schema';

export type OrganizationRow = typeof organizations.$inferSelect;

export enum OrganizationType {
  Agency = 'agency',
  InHouse = 'in-house',
}

export const ORGANIZATION_TYPES = Object.values(OrganizationType);
