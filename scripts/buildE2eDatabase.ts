/**
 * Builds the disposable SQLite image used by Playwright. The checked-in demo
 * fixture remains the source of truth; regenerate this image after a schema or
 * fixture change instead of committing a binary database to git.
 *
 * Run with `bun run e2e:prepare` (normally via `bun test:e2e`).
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { eq, sql } from 'drizzle-orm';

import { createDatabase } from '../libs/database/client';
import { migrateDatabase } from '../libs/database/migrate';
import { sources } from '../libs/database/schema';
import { seedDemoFromFixture } from './dbDemo/seed';
import { DEMO_FIXTURE_VERSION, type DemoFixture } from './dbDemo/types';

export const E2E_GOLDEN_DATABASE_PATH = resolve(
  import.meta.dirname,
  '..',
  'tests',
  'e2e',
  'fixtures',
  'golden.db'
);

const DEMO_FIXTURE_PATH = resolve(import.meta.dirname, 'fixtures', 'demo-data.json');

export async function main(): Promise<void> {
  mkdirSync(dirname(E2E_GOLDEN_DATABASE_PATH), { recursive: true });
  removeDatabase(E2E_GOLDEN_DATABASE_PATH);

  const database = await createDatabase(E2E_GOLDEN_DATABASE_PATH);
  try {
    await migrateDatabase(database, E2E_GOLDEN_DATABASE_PATH);
    const fixture = loadFixture();
    await seedDemoFromFixture(database, fixture, { force: false });
    await addBrandOwnedSource(database, fixture);
    // The test fixture copies only the main `.db` file. Checkpoint WAL writes before closing so
    // every seeded row is in that copy rather than a transient `-wal` sidecar.
    await database.run(sql.raw('PRAGMA wal_checkpoint(TRUNCATE)'));
  } finally {
    (database as unknown as { $client: { close(): void } }).$client.close();
  }

  console.log(`e2e: built golden database at ${E2E_GOLDEN_DATABASE_PATH}`);
}

/** The demo fixture represents third-party citations only. Brands coverage also
 * needs one first-party source so its table and export are meaningful. Keep the
 * public demo JSON untouched; this is test-only data added to the generated DB. */
async function addBrandOwnedSource(
  database: Awaited<ReturnType<typeof createDatabase>>,
  fixture: DemoFixture
): Promise<void> {
  const source = fixture.sources[0];
  if (!source) throw new Error('e2e: demo fixture has no source rows.');

  await database
    .update(sources)
    .set({
      clean_url: 'meridianrun.example/guides/daily-training',
      hostname: 'meridianrun.example',
      url: 'https://meridianrun.example/guides/daily-training',
    })
    .where(eq(sources.id, source.id));
}

function loadFixture(): DemoFixture {
  const fixture = JSON.parse(readFileSync(DEMO_FIXTURE_PATH, 'utf-8')) as DemoFixture;
  if (fixture.version !== DEMO_FIXTURE_VERSION) {
    throw new Error(
      `e2e: demo fixture version ${fixture.version} is unsupported; regenerate it with \`bun run db:snapshot\`.`
    );
  }
  return fixture;
}

function removeDatabase(path: string): void {
  for (const candidate of [path, `${path}-shm`, `${path}-wal`]) {
    if (existsSync(candidate)) rmSync(candidate, { force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
