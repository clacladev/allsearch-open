import { sql } from 'drizzle-orm';
// Relative import, not the `@/` alias: `libs/database/Settings/queries.ts` and
// `libs/database/Organizations/queries.ts` are `import 'server-only'`, so they can't be imported
// from this Playwright process (there is no `mock.module` shim outside bun tests). This helper
// talks to the same SQLite file the hand-started dev server uses via raw SQL against
// `libs/database/schema.ts` instead.
import { createDatabase } from '../../../libs/database/client';

/** Refuses to run without an explicit ALLSEARCH_DB_PATH: these helpers DELETE organizations and
 * projects, and wipe provider keys. Pointed at a default path they would destroy the developer's
 * real install. */
export function requireTestDatabasePath(): string {
  const dbPath = process.env.ALLSEARCH_DB_PATH;
  if (!dbPath) {
    throw new Error(
      'ALLSEARCH_DB_PATH must be set to run tests/e2e/first-run.spec.ts — these helpers DELETE ' +
        'organizations, projects, and wipe provider keys, and without an explicit override they ' +
        "would do so against the developer's real install."
    );
  }
  return dbPath;
}

/** Raw SQL bypasses drizzle's `$defaultFn`, which is what normally fills `created_at`/`updated_at`
 * — both `NOT NULL` in the schema (see libs/database/schema.ts) — so this helper has to supply
 * them itself on insert. */
async function ensureSettingsSingleton(db: Awaited<ReturnType<typeof createDatabase>>) {
  const now = new Date().toISOString();
  await db.run(
    sql`INSERT INTO settings (id, created_at, updated_at) VALUES ('singleton', ${now}, ${now}) ON CONFLICT DO NOTHING`
  );
}

/** Resets the install to a fresh-install state: no provider keys, no organization, no projects.
 * `projects` has no foreign key to `organizations` in the schema, so these have to be deleted
 * separately rather than relying on a cascade. */
export async function resetInstallState(): Promise<void> {
  const dbPath = requireTestDatabasePath();
  const db = await createDatabase(dbPath);
  await ensureSettingsSingleton(db);
  await db.run(sql`UPDATE settings SET provider_keys = '{}'`);
  await db.run(sql`DELETE FROM organizations`);
  await db.run(sql`DELETE FROM projects`);
}

/** Seeds a valid Google provider key directly in the DB — the server-side validation call
 * `POST /api/settings/provider-keys` makes to `generativelanguage.googleapis.com` can't be
 * intercepted by `page.route`, so tests that need to get past the keys step mock that POST *and*
 * write the key through this helper in the same route handler, keeping client and server state in
 * agreement. */
export async function seedGoogleKey(): Promise<void> {
  const dbPath = requireTestDatabasePath();
  const db = await createDatabase(dbPath);
  await ensureSettingsSingleton(db);
  const storedKey = JSON.stringify({
    key: 'e2e-fake-google-key',
    status: 'valid',
    validatedAt: new Date().toISOString(),
  });
  await db.run(
    sql`UPDATE settings SET provider_keys = json_set(provider_keys, '$.google', json(${storedKey}))`
  );
}
