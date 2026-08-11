/**
 * `bun run db:seed:demo` — one-command bootstrap for a fresh checkout. Creates
 * the DB at `getDatabasePath()` (or `ALLSEARCH_DB_PATH` if overridden), runs
 * drizzle migrations against it without ever starting Next.js, then loads
 * `scripts/fixtures/demo-data.json` into it. After this + `bun run dev`, the
 * dashboard loads with pre-populated data — no onboarding, no real credentials
 * in git history.
 *
 * Refuses (exits non-zero, leaves the DB untouched) if the destination DB already
 * holds user data unless `--force` is passed. `--force` deletes every user-data
 * row first (the live (private) layout's redirect-to-onboarding gate assumes
 * rows exist; mixing demo data with real data has undefined effects).
 *
 * Run: bun run db:seed:demo             (fresh-checkout default)
 *      bun run db:seed:demo -- --force  (re-seed over an existing demo DB)
 *
 * See `.context/attachments/DpB51K/session-transcript-…md` for the design spec.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createDatabase } from '../libs/database/client';
import { getDatabasePath } from '../libs/database/paths';
import { migrateDatabase } from '../libs/database/migrate';
import { seedDemoFromFixture } from './dbDemo/seed';
import { DEMO_FIXTURE_VERSION, type DemoFixture } from './dbDemo/types';

const DEFAULT_FIXTURE_PATH = resolve(import.meta.dirname, 'fixtures', 'demo-data.json');

export async function main(): Promise<void> {
  const force = process.argv.includes('--force');
  const fixturePath = resolveFixturePath();
  if (!existsSync(fixturePath)) {
    console.error(
      `db:seed:demo: fixture not found at ${fixturePath}. Run \`bun run db:snapshot\` first ` +
        '(or check the path you passed via --fixture).'
    );
    process.exit(1);
  }
  const fixture = loadAndValidateFixture(fixturePath);

  const dbPath = getDatabasePath();
  console.log(`db:seed:demo: opening DB at ${dbPath}${force ? ' (--force)' : ''}`);
  const db = await createDatabase(dbPath);
  try {
    // Run migrations first so the schema the fixture inserts into is current. The
    // point of this command is "one command, no ordering dependency on starting
    // the app" — see transcript Q10. `migrateDatabase` backs up a pre-existing DB
    // before altering it; a fresh checkout has nothing to back up.
    console.log('db:seed:demo: applying migrations');
    await migrateDatabase(db, dbPath);
    console.log('db:seed:demo: seeding fixture');
    await seedDemoFromFixture(db, fixture, { force });
    console.log(
      `db:seed:demo: done. ${fixture.collection_runs.length} runs, ` +
        `${fixture.competitors.length} competitors, ${fixture.sources.length} sources loaded.`
    );
    console.log(`\nNext step: \`bun run dev\` — land straight on the dashboard.`);
  } finally {
    (db as unknown as { $client: { close(): void } }).$client.close();
  }
}

function resolveFixturePath(): string {
  const idx = process.argv.indexOf('--fixture');
  if (idx >= 0 && process.argv[idx + 1]) return resolve(process.argv[idx + 1]);
  return DEFAULT_FIXTURE_PATH;
}

function loadAndValidateFixture(path: string): DemoFixture {
  const text = readFileSync(path, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`db:seed:demo: fixture at ${path} is not valid JSON: ${err}`);
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`db:seed:demo: fixture at ${path} is not a JSON object`);
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.version !== DEMO_FIXTURE_VERSION) {
    throw new Error(
      `db:seed:demo: fixture at ${path} has version ${String(
        obj.version
      )}, but this seed command supports only version ${DEMO_FIXTURE_VERSION}.` +
        'Regenerate the fixture with `bun run db:snapshot`.'
    );
  }
  for (const key of [
    'organization',
    'settings',
    'project',
    'competitors',
    'topics',
    'prompts',
    'collection_runs',
    'collection_run_items',
    'prompt_responses',
    'sources',
  ]) {
    if (!(key in obj)) {
      throw new Error(
        `db:seed:demo: fixture at ${path} is missing the "${key}" key — regenerate with \`bun run db:snapshot\`.`
      );
    }
  }
  return obj as unknown as DemoFixture;
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});