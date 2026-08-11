import { sql } from 'drizzle-orm';

import type { AllSearchDatabase } from '../../libs/database/client';
import {
  collectionRunItems,
  collectionRuns,
  competitors,
  organizations,
  promptResponses,
  prompts,
  projects,
  settings,
  sources,
  topics,
} from '../../libs/database/schema';
import type { DemoFixture } from './types';

/**
 * Loads a `DemoFixture` into the given DB, inserting rows in foreign-key-safe
 * order through drizzle's query builders — the JSON-mode columns (`aliases`,
 * `provider_keys`, `brand_ids_ranking`, `sentiment`, `headings`, ...) are passed
 * as JS-native and drizzle stringifies them. The fixture's pre-bound `id`
 * columns override the schema's `crypto.randomUUID()` `$defaultFn`, so row
 * relationships across the fixture survive the round-trip through JSON.
 *
 * Drizzle (not raw SQL) here because unlike `tests/e2e/helpers/installState.ts`,
 * this script has no `server-only`-guard problem — `createDatabase` is the only
 * thing imported that hits `server-only`, and it isn't a `queries.ts` file.
 *
 * Refuses to run if the destination DB has any user-data rows already (one or
 * more rows in `organizations`, `projects`, `competitors`, `topics`, `prompts`,
 * `collection_runs`, `prompt_responses`, `sources`, `prompt_articles` — any of
 * them is enough to refuse). `force = true` overrides: it `DELETE`s every row in
 * every user-data table (in FK-reverse order) first, then seeds. This is what a
 * tester running `npm run db:seed:demo -- --force` against a stale local DB
 * wants. A fresh checkout never hits this path.
 */
export async function seedDemoFromFixture(
  db: AllSearchDatabase,
  fixture: DemoFixture,
  options: { force?: boolean } = {}
): Promise<void> {
  if (!options.force) {
    await refuseIfNonEmpty(db);
  } else {
    await wipeExistingUserData(db);
  }

  await db.insert(organizations).values(toInsert(fixture.organization));
  await db.insert(settings).values(toInsert(fixture.settings));
  await db.insert(projects).values(toInsert(fixture.project));
  if (fixture.competitors.length) {
    await db.insert(competitors).values(fixture.competitors.map(toInsert));
  }
  if (fixture.topics.length) await db.insert(topics).values(fixture.topics.map(toInsert));
  if (fixture.prompts.length) await db.insert(prompts).values(fixture.prompts.map(toInsert));
  if (fixture.collection_runs.length) {
    await db.insert(collectionRuns).values(fixture.collection_runs.map(toInsert));
  }
  if (fixture.collection_run_items.length) {
    await db.insert(collectionRunItems).values(fixture.collection_run_items.map(toInsert));
  }
  if (fixture.prompt_responses.length) {
    await db.insert(promptResponses).values(fixture.prompt_responses.map(toInsert));
  }
  if (fixture.sources.length) await db.insert(sources).values(fixture.sources.map(toInsert));
}

/** Tables that hold data the seed needs to (re)write — both real user data
 * *and* the `settings` singleton install-metadata row. `settings` is included
 * on `--force` only, so a pre-existing install's singleton can be replaced by
 * the demo fixture's redacted singleton without an UNIQUE-constraint failure.
 * Excluded from `refuseIfNonEmpty` (the fresh-migrated DB always has zero
 * settings rows — the backfill migration `UPDATE`s, never `INSERT`s). */
const USER_DATA_TABLES = [
  'sources',
  'prompt_responses',
  'collection_run_items',
  'collection_runs',
  'prompts',
  'topics',
  'competitors',
  'prompt_articles',
  'projects',
  'organizations',
  'settings',
] as const;

async function refuseIfNonEmpty(db: AllSearchDatabase): Promise<void> {
  const [row] = await db.all<{ n: number }>(
    sql`SELECT (
      (SELECT count(*) FROM organizations) +
      (SELECT count(*) FROM projects) +
      (SELECT count(*) FROM competitors) +
      (SELECT count(*) FROM topics) +
      (SELECT count(*) FROM prompts) +
      (SELECT count(*) FROM collection_runs) +
      (SELECT count(*) FROM prompt_responses) +
      (SELECT count(*) FROM sources) +
      (SELECT count(*) FROM prompt_articles)
    ) AS n`
  );
  if ((row?.n ?? 0) > 0) {
    throw new Error(
      'Demo seed refuses to run — the destination DB already has user data. ' +
        'Re-run with `--force` to wipe and reseed. (Has no effect until you confirm.)'
    );
  }
}

/** Deletes every row in every user-data table in FK-reverse order, ignoring
 * "no such table" (won't happen on a migrated DB but costing nothing to be safe). */
async function wipeExistingUserData(db: AllSearchDatabase): Promise<void> {
  for (const table of USER_DATA_TABLES) {
    await db.run(sql.raw(`DELETE FROM "${table}";`));
  }
}

// Insert helpers — `as` casts the JSON-mode columns to the loose type drizzle's
// `values()` accepts. Plain cast, not a runtime coerce: we trust the fixture's
// shape (validated on load in `dbSeedDemo.ts`).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyInsert = any;
const toInsert = <T>(row: T): AnyInsert => row as unknown as AnyInsert;