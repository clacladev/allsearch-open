export const TABLE_ORGANIZATIONS = 'organizations';

export enum OrganizationType {
  Agency = 'agency',
  InHouse = 'in-house',
}

export const ORGANIZATION_TYPES = Object.values(OrganizationType);

export type OrganizationRow = {
  id: string;
  type: OrganizationType;
  url: string | null;
  name: string | null;
  icon_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};
