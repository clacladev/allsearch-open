export const TABLE_COMPETITORS = 'competitors';

export type CompetitorRow = {
  id: string;
  url: string;
  hostname: string;
  name: string | null;
  aliases: string[];
  icon_url: string | null;
  project_id: string;
  organization_id: string;
  is_archived: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
};
