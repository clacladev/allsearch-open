export const TABLE_PROJECTS = 'projects';

export type ProjectRow = {
  id: string;
  url: string;
  hostname: string;
  name: string;
  aliases: string[];
  icon_url: string | null;
  target_location: string | null;
  organization_id: string;
  author_id: string;
  prompts_updated_at: string | null;
  is_paused: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};
