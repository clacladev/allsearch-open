/**
 * `bun run db:snapshot` — reads the developer's live local AllSearch SQLite DB
 * and regenerates `scripts/fixtures/demo-data.json`: a redacted, fictionalised,
 * and synthetically-populated JSON fixture committed to the repo so a fresh
 * checkout can land on the dashboard with one command (`bun run db:seed:demo`).
 *
 * Snapshot workflow (see `.context/attachments/DpB51K/session-transcript-…md`):
 *  *  1. SELECT org (oldest), the first project, its competitors/topics/prompts, and
 *     the settings singleton out of the live DB at `getDatabasePath()` (or
 *     `ALLSEARCH_DB_PATH` if overridden).
 *  2. `buildDemoFixture` redacts `settings.provider_keys` to placeholder/invalid
 *     keys, replaces the org/project/competitor names with obviously fictional
 *     `.example`-TLDed placeholders, and replaces the live DB's (currently empty)
 *     `collection_runs` history with 6 weekly synthetic runs (4 completed, 1
 *     failed, 1 deliberate gap) — enough to exercise this branch's cadence/trend
 *     /staleness-banner surfaces.
 *  3. Writes the fixture (pretty-printed, sorted top-level keys) to
 *     `scripts/fixtures/demo-data.json`.
 *
 * Reads only. Does not mutate the live DB, does not run migrations, does not
 * insert. A 4KB-at-most JSON file is the only side effect.
 *
 * Note on anchor drift: the synthetic weekly history anchors on `new Date()` at
 * snapshot time (see `syntheticHistory.ts`). The committed fixture's
 * `generatedAt` reflects when it was last regenerated, but stays put until the
 * next `db:snapshot` run — a fixture left unrefreshed for months will show older
 * runs than the calendar suggests. Re-run `bun run db:snapshot` against a live
 * dev DB whenever the cadence/trend UI on this branch changes.
 *
 * Run: bun run db:snapshot
 *      bun run db:snapshot -- --out PATH   (write to a different path — tests use this)
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { createDatabase } from '../libs/database/client';
import { getDatabasePath } from '../libs/database/paths';
import { sql } from 'drizzle-orm';
import { buildDemoFixture, type LiveRows } from './dbDemo/buildDemoFixture';
import type { DemoFixture } from './dbDemo/types';

const DEFAULT_OUT_PATH = resolve(import.meta.dirname, 'fixtures', 'demo-data.json');

export async function main(): Promise<void> {
  const outPath = resolveOutPath();
  const dbPath = getDatabasePath();
  console.log(`db:snapshot: reading live DB at ${dbPath}`);
  const db = await createDatabase(dbPath);
  try {
    const live = await readLiveRows(db);
    const fixture = buildDemoFixture(live, { anchor: new Date() });
    writeFixture(outPath, fixture);
    console.log(
      `db:snapshot: wrote ${outPath} (v${fixture.version}) — ` +
        `${fixture.competitors.length} competitors, ${fixture.topics.length} topics, ` +
        `${fixture.prompts.length} prompts, ${fixture.collection_runs.length} runs, ` +
        `${fixture.collection_run_items.length} run items, ` +
        `${fixture.prompt_responses.length} responses, ${fixture.sources.length} sources.`
    );
  } finally {
    (db as unknown as { $client: { close(): void } }).$client.close();
  }
}

function resolveOutPath(): string {
  const idx = process.argv.indexOf('--out');
  if (idx >= 0 && process.argv[idx + 1]) return resolve(process.argv[idx + 1]);
  return DEFAULT_OUT_PATH;
}

async function readLiveRows(db: Awaited<ReturnType<typeof createDatabase>>): Promise<LiveRows> {
  const [organization] = await db.all<LiveRows['organization']>(
    sql`SELECT id, created_at, updated_at, type, url, name, icon_url FROM organizations ORDER BY created_at ASC LIMIT 1`
  );
  if (!organization) {
    throw new Error(
      `db:snapshot: the live DB at ${getDatabasePath()} has no organization row. ` +
        'Complete onboarding once so the snapshot has something to fictionalise, then re-run.'
    );
  }

  const [settingsRow] = await db.all<LiveRows['settings']>(
    sql`SELECT id, created_at, updated_at, provider_keys, enabled_chatbots FROM settings ORDER BY created_at ASC LIMIT 1`
  );
  if (!settingsRow) {
    throw new Error(
      `db:snapshot: the live DB at ${getDatabasePath()} has no settings row. ` +
        'Run `bun run dev` once to auto-create the singleton, then re-run.'
    );
  }

  const projects = await db.all<LiveRows['projects'][number]>(
    sql`SELECT id, created_at, updated_at, url, name, aliases, hostname, icon_url, prompts_updated_at, is_paused, is_archived, target_location FROM projects ORDER BY created_at ASC`
  );
  if (!projects.length) {
    throw new Error(
      `db:snapshot: the live DB has project rows but no project — onboarding needs to run once ` +
        'before the snapshot has anything to fictionalise.'
    );
  }
  const projectId = projects[0].id;

  const competitors = await db.all<LiveRows['competitors'][number]>(
    sql`SELECT id, created_at, updated_at, url, name, aliases, icon_url, project_id, hostname, is_archived FROM competitors WHERE project_id = ${projectId} ORDER BY created_at ASC`
  );
  const topics = await db.all<LiveRows['topics'][number]>(
    sql`SELECT id, created_at, updated_at, name, project_id, is_archived FROM topics WHERE project_id = ${projectId} ORDER BY created_at ASC`
  );
  const prompts = await db.all<LiveRows['prompts'][number]>(
    sql`SELECT p.id, p.created_at, p.updated_at, p.name, p.topic_id, p.project_id, p.is_archived FROM prompts p WHERE p.project_id = ${projectId} ORDER BY p.created_at ASC`
  );

  return { organization, settings: settingsRow, projects, competitors, topics, prompts };
}

function writeFixture(outPath: string, fixture: DemoFixture): void {
  mkdirSync(dirname(outPath), { recursive: true });
  const json = JSON.stringify(fixture, null, 2) + '\n';
  writeFileSync(outPath, json, { encoding: 'utf-8' });
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});