import type {
  DemoCompetitorRow,
  DemoFixture,
  DemoOrganizationRow,
  DemoProjectRow,
  DemoPromptRow,
  DemoSettingsRow,
  DemoTopicRow,
} from './types';
import { DEMO_FIXTURE_VERSION } from './types';
import {
  DEMO_ORGANIZATION,
  DEMO_PROJECT,
  DEMO_PROVIDER_KEYS,
  demoCompetitor,
  demoPromptName,
  demoTopicName,
} from './fictionalRenames';
import { buildSyntheticHistory } from './syntheticHistory';

/**
 * The "live DB row" shape `buildDemoFixture` consumes. Loose-by-design: every
 * column our redaction+synthesis step needs is listed, everything else from the
 * real schema is ignored. This is what the snapshot entry script reads out of the
 *  live SQLite DB via raw `SELECT ...` (server-only guards make the modules under
 *  `libs/database/.../queries.ts` unimportable from a script — see
 *  `tests/e2e/helpers/installState.ts` for the same pattern).
 */
export type LiveRows = {
  organization: {
    id: string;
    created_at: string;
    updated_at: string;
    type: 'agency' | 'in-house';
    url: string | null;
    name: string | null;
    icon_url: string | null;
  };
  settings: {
    id: string;
    created_at: string;
    updated_at: string;
    provider_keys: unknown; // Raw DB JSON string OR parsed object — normalised below.
    enabled_chatbots: unknown;
  };
  projects: {
    id: string;
    created_at: string;
    updated_at: string;
    url: string;
    name: string;
    aliases: unknown;
    hostname: string;
    icon_url: string | null;
    prompts_updated_at: string | null;
    is_paused: number;
    is_archived: number;
    target_location: string | null;
  }[];
  competitors: {
    id: string;
    created_at: string;
    updated_at: string;
    url: string;
    name: string | null;
    aliases: unknown;
    icon_url: string | null;
    project_id: string;
    hostname: string;
    is_archived: number;
  }[];
  topics: {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    project_id: string;
    is_archived: number;
  }[];
  prompts: {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    topic_id: string;
    project_id: string;
    is_archived: number;
  }[];
};

export type BuildDemoFixtureOptions = {
  /** Anchor point the synthetic weekly cadence history counts back from.
   * Defaults to `new Date()` in the snapshot entry script. Tests pin it for
   * determinism. */
  anchor?: Date;
};

/** Redacts + renames + synthethically-populates the live DB read into a
 * `DemoFixture` ready to JSON-stringify. Pure and side-effect free so the snapshot
 * command's entry point can be tiny and tests can drive it directly. */
export function buildDemoFixture(live: LiveRows, options: BuildDemoFixtureOptions = {}): DemoFixture {
  const anchor = options.anchor ?? new Date();
  const projectRow = live.projects[0];
  if (!projectRow) {
    throw new Error(
      'buildDemoFixture: live DB has no project rows — the snapshot needs at least one project to anchor the demo on.'
    );
  }

  const projectId = projectRow.id;

  const organization: DemoOrganizationRow = {
    id: live.organization.id,
    created_at: live.organization.created_at,
    updated_at: live.organization.updated_at,
    type: DEMO_ORGANIZATION.type,
    url: DEMO_ORGANIZATION.url,
    name: DEMO_ORGANIZATION.name,
    icon_url: live.organization.icon_url,
  };

  // Replace the live settings' provider_keys (which may carry real keys in
  // plaintext — see libs/database/schema.ts `settings.provider_keys`) with the
  // placeholder/invalid keys. `enabled_chatbots = null` keeps the "default to
  // every Chatbot that has a key" fresh-install behaviour.
  const settings: DemoSettingsRow = {
    id: 'singleton',
    created_at: live.settings.created_at,
    updated_at: live.settings.updated_at,
    provider_keys: DEMO_PROVIDER_KEYS,
    enabled_chatbots: null,
  };

  const project: DemoProjectRow = {
    id: projectId,
    created_at: projectRow.created_at,
    updated_at: projectRow.updated_at,
    url: DEMO_PROJECT.url,
    name: DEMO_PROJECT.name,
    aliases: normalizeStringArray(projectRow.aliases),
    hostname: DEMO_PROJECT.hostname,
    icon_url: projectRow.icon_url,
    prompts_updated_at: projectRow.prompts_updated_at,
    is_paused: boolFromInt(projectRow.is_paused),
    is_archived: boolFromInt(projectRow.is_archived),
    target_location: projectRow.target_location,
  };

  const competitors: DemoCompetitorRow[] = live.competitors.map((row, idx) => {
    const demo = demoCompetitor(idx);
    return {
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      url: `https://${demo.hostname}`,
      name: demo.name,
      aliases: normalizeStringArray(row.aliases),
      hostname: demo.hostname,
      icon_url: row.icon_url,
      project_id: row.project_id,
      is_archived: boolFromInt(row.is_archived),
    };
  });

  // Topics + prompts are pool-replaced by index (Q12 asked for fictional
  // topic/prompt names, not just brand-substring substitution — otherwise the
  // live DB's real topic/prompt text would leak into the committed fixture
  // verbatim). The pools are running-themed so the demo stays coherent.
  const topics: DemoTopicRow[] = live.topics.map((row, idx) => ({
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    name: demoTopicName(idx),
    project_id: row.project_id,
    is_archived: boolFromInt(row.is_archived),
  }));

  const prompts: DemoPromptRow[] = live.prompts.map((row, idx) => ({
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    name: demoPromptName(idx),
    topic_id: row.topic_id,
    project_id: row.project_id,
    is_archived: boolFromInt(row.is_archived),
  }));

  const history = buildSyntheticHistory({
    project: { id: project.id, name: project.name },
    prompts: prompts.map((p) => ({ id: p.id, name: p.name })),
    competitors: competitors.map((c) => ({ id: c.id })),
    anchor,
  });

  return {
    version: DEMO_FIXTURE_VERSION,
    generatedAt: anchor.toISOString(),
    organization,
    settings,
    project,
    competitors,
    topics,
    prompts,
    collection_runs: history.collection_runs,
    collection_run_items: history.collection_run_items,
    prompt_responses: history.prompt_responses,
    sources: history.sources,
  };
}

/** SQLite stores booleans as 0/1 int with `mode: 'boolean'`, but raw `SELECT`
 * returns the raw int. Normalise. */
function boolFromInt(n: unknown): boolean {
  return Boolean(n);
}

/** Normalises a `aliases`/`enabled_chatbots`/similar column coming back from raw
 * SQL — either an already-parsed object (drizzle JSON mode) or a JSON string — to
 * the typed JS array shape. */
function normalizeStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string' && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}