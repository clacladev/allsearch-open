import type { ChatbotId } from '../../libs/database/shared/ChatbotId';
import type { ProviderId } from '../../libs/database/shared/ProviderId';
import type { ProviderKeyStatus } from '../../libs/database/Settings/types';
import type { PageHeading } from '../../libs/utils/urlAnalysis';

/**
 * Versioned, serialisable shape of `scripts/fixtures/demo-data.json`.
 *
 * The fixture mirrors the columns the seed script needs to insert through drizzle
 * (see `scripts/dbDemo/seed.ts`), in foreign-key-safe order: `organization` →
 * `settings` → `project` → `competitors` → `topics` → `prompts` → `collection_runs`
 * → `collection_run_items` → `prompt_responses` → `sources`. Drizzle's JSON-mode
 * columns (`aliases`, `provider_keys`, `brand_ids_ranking`, `sentiment`,
 * `headings`, ...) are stored here as the JS-native shape — the seed script passes
 * them straight through `db.insert(...).values(...)` and drizzle stringifies them.
 *
 * `id` columns are explicit (not left to `crypto.randomUUID()` `$defaultFn`) so row
 * relationships across the fixture survive the round-trip through JSON. Timestamps
 * are pre-bound ISO strings so the demo's "weekly cadence" history stays anchored
 * where the snapshot captured it, not at seed-time `new Date()`.
 *
 * Only present elsewhere in the schema but excluded from this fixture:
 *   - `prompt_articles` — demo gate exercises only orgs+projects+cadence, never
 *     opportunity/article writes; including empty rows would do nothing but
 *     unbalance the JSON envelope.
 *   - `organizations` rows beyond the first — the private layout reads only the
 *     oldest one (see `app/(private)/layout.tsx`), so the demo keeps just one.
 */

export const DEMO_FIXTURE_VERSION = 1 as const;

export type DemoFixture = {
  version: typeof DEMO_FIXTURE_VERSION;
  /** ISO timestamp at which the snapshot was generated; purely informational. */
  generatedAt: string;
  organization: DemoOrganizationRow;
  settings: DemoSettingsRow;
  project: DemoProjectRow;
  competitors: DemoCompetitorRow[];
  topics: DemoTopicRow[];
  prompts: DemoPromptRow[];
  collection_runs: DemoCollectionRunRow[];
  collection_run_items: DemoCollectionRunItemRow[];
  prompt_responses: DemoPromptResponseRow[];
  sources: DemoSourceRow[];
};

export type DemoOrganizationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  type: 'agency' | 'in-house';
  url?: string | null;
  name?: string | null;
  icon_url?: string | null;
};

export type DemoSettingsRow = {
  id: string;
  created_at: string;
  updated_at: string;
  provider_keys: Partial<
    Record<ProviderId, { key: string; status: ProviderKeyStatus; validatedAt: string }>
  >;
  /** `null` = "user has never touched the toggle" — fresh-install default. */
  enabled_chatbots: ChatbotId[] | null;
};

export type DemoProjectRow = {
  id: string;
  created_at: string;
  updated_at: string;
  url: string;
  name: string;
  aliases: string[];
  hostname: string;
  icon_url?: string | null;
  prompts_updated_at: string | null;
  is_paused: boolean;
  is_archived: boolean;
  target_location: string | null;
};

export type DemoCompetitorRow = {
  id: string;
  created_at: string;
  updated_at: string;
  url: string;
  name: string | null;
  aliases: string[];
  hostname: string;
  icon_url: string | null;
  project_id: string;
  is_archived: boolean;
};

export type DemoTopicRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  project_id: string;
  is_archived: boolean;
};

export type DemoPromptRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  topic_id: string;
  project_id: string;
  is_archived: boolean;
};

export type CollectionRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type CollectionRunScope = 'all' | 'projects';

export type DemoCollectionRunRow = {
  id: string;
  status: CollectionRunStatus;
  scope: CollectionRunScope;
  started_at: string | null;
  finished_at: string | null;
  items_total: number;
  items_completed: number;
  items_failed: number;
  error: string | null;
  created_at: string;
};

export type DemoCollectionRunItemRow = {
  id: string;
  run_id: string;
  project_id: string;
  prompt_id: string;
  chatbot_id: ChatbotId;
  status: CollectionRunStatus;
  attempts: number;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type DemoPromptResponseRow = {
  id: string;
  created_at: string;
  text: string;
  chatbot_id: ChatbotId;
  prompt_id: string;
  project_id: string;
  model_id: string;
  brand_ids_ranking: string[];
  sentiment: Record<string, -2 | -1 | 0 | 1 | 2> | null;
  run_id: string | null;
};

export type DemoSourceRow = {
  id: string;
  created_at: string;
  project_id: string;
  prompt_id: string;
  prompt_response_id: string;
  is_cited: boolean;
  position: number;
  clean_url: string;
  url: string;
  hostname: string;
  raw_url: string | null;
  title: string | null;
  description: string | null;
  headings: PageHeading[] | null;
  brand_ids_ranking: string[];
};