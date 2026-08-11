import { afterEach, describe, expect, it } from 'bun:test';
import { sql } from 'drizzle-orm';

import { createDatabase, type AllSearchDatabase } from '@/libs/database/client';
import { migrateDatabase } from '@/libs/database/migrate';
import { buildDemoFixture, type LiveRows } from '@/scripts/dbDemo/buildDemoFixture';
import { seedDemoFromFixture } from '@/scripts/dbDemo/seed';
import type { DemoFixture } from '@/scripts/dbDemo/types';
import {
  cleanupTempDbPath,
  closeDatabase,
  createTempDbPath,
} from '../database/testHelpers';

/** Builds a `LiveRows` object that mimics what the live Hoka dev DB looks like:
 * one agency (real name "Tugulab"), one project ("Hoka"), 5 competitors, 2
 * topics, 4 prompts. Snapshotted here so this test is independent of the live
 * dev DB's current contents. */
function fakeHokaLikeLiveRows(): LiveRows {
  const NOW = '2026-08-11T09:00:00.000Z';
  return {
    organization: {
      id: '00000000-0000-0000-0000-aaaaaaaaaaaa',
      created_at: '2026-07-01T00:00:00.000Z',
      updated_at: '2026-07-01T00:00:00.000Z',
      type: 'agency',
      url: 'tugulab.org',
      name: 'Tugulab',
      icon_url: null,
    },
    settings: {
      id: 'singleton',
      created_at: '2026-07-01T00:00:00.000Z',
      updated_at: '2026-07-01T00:00:00.000Z',
      // Real plaintext-key shape, or default '{}'. Either way the redactor must
      // replace it entirely — that's the whole point.
      provider_keys: {
        google: { key: 'REAL-SECRET-real-google-key', status: 'valid', validatedAt: NOW },
      },
      enabled_chatbots: null,
    },
    projects: [
      {
        id: '00000000-0000-0000-0000-bbbbbbbbbbbb',
        created_at: '2026-07-02T00:00:00.000Z',
        updated_at: '2026-07-02T00:00:00.000Z',
        url: 'hoka.com', // realBrand — must be overwritten by fictional renamer
        name: 'Hoka',
        aliases: ['hoka', 'hoka.com'],
        hostname: 'hoka.com',
        icon_url: null,
        prompts_updated_at: '2026-07-02T01:00:00.000Z',
        is_paused: 0,
        is_archived: 0,
        target_location: null,
      },
    ],
    competitors: [
      compet(0, 'Saucony', 'saucony.com'),
      compet(1, 'Brooks', 'brooksrunning.com'),
      compet(2, 'New Balance', 'newbalance.com'),
      compet(3, 'Nike', 'nike.com'),
      compet(4, 'ASICS', 'asics.com'),
    ],
    topics: [
      {
        id: '00000000-0000-0000-0000-ccccccccccc1',
        created_at: NOW,
        updated_at: NOW,
        name: 'Road Running Shoes',
        project_id: '00000000-0000-0000-0000-bbbbbbbbbbbb',
        is_archived: 0,
      },
      {
        id: '00000000-0000-0000-0000-ccccccccccc2',
        created_at: NOW,
        updated_at: NOW,
        name: 'Trail Running Shoes',
        project_id: '00000000-0000-0000-0000-bbbbbbbbbbbb',
        is_archived: 0,
      },
    ],
    prompts: [
      {
        id: '00000000-0000-0000-0000-dddddddddd01',
        created_at: NOW,
        updated_at: NOW,
        name: 'Best cushioned road running shoes for daily training',
        topic_id: '00000000-0000-0000-0000-ccccccccccc1',
        project_id: '00000000-0000-0000-0000-bbbbbbbbbbbb',
        is_archived: 0,
      },
      {
        id: '00000000-0000-0000-0000-dddddddddd02',
        created_at: NOW,
        updated_at: NOW,
        name: 'Top rated road running shoes for long-distance comfort',
        topic_id: '00000000-0000-0000-0000-ccccccccccc1',
        project_id: '00000000-0000-0000-0000-bbbbbbbbbbbb',
        is_archived: 0,
      },
      {
        id: '00000000-0000-0000-0000-dddddddddd03',
        created_at: NOW,
        updated_at: NOW,
        name: 'Best trail running shoes for technical terrain',
        topic_id: '00000000-0000-0000-0000-ccccccccccc2',
        project_id: '00000000-0000-0000-0000-bbbbbbbbbbbb',
        is_archived: 0,
      },
      {
        id: '00000000-0000-0000-0000-dddddddddd04',
        created_at: NOW,
        updated_at: NOW,
        name: 'Grip-focused trail shoes for muddy and uneven paths',
        topic_id: '00000000-0000-0000-0000-ccccccccccc2',
        project_id: '00000000-0000-0000-0000-bbbbbbbbbbbb',
        is_archived: 0,
      },
    ],
  };

  function compet(idx: number, name: string, hostname: string) {
    return {
      id: `00000000-0000-0000-0000-c${String(idx).padStart(12, '0')}`,
      created_at: NOW,
      updated_at: NOW,
      url: hostname,
      name,
      aliases: [] as string[],
      icon_url: null,
      project_id: '00000000-0000-0000-0000-bbbbbbbbbbbb',
      hostname,
      is_archived: 0,
    };
  }
}

describe('buildDemoFixture', () => {
  it('redacts provider_keys to all three placeholders, dropping any real key', () => {
    const fixture = buildDemoFixture(fakeHokaLikeLiveRows(), {
      anchor: new Date('2026-08-11T11:00:00.000Z'),
    });

    const { provider_keys } = fixture.settings;
    expect(Object.keys(provider_keys).sort()).toEqual(['google', 'openai', 'perplexity']);
    // Real key from the live DB must NOT survive:
    expect(JSON.stringify(provider_keys)).not.toContain('REAL-SECRET-real-google-key');
    // All three keys are the public invalid placeholder:
    expect(provider_keys.google?.key).toBe('demo-invalid-google-key-replace-me');
    expect(provider_keys.openai?.key).toBe('demo-invalid-openai-key-replace-me');
    expect(provider_keys.perplexity?.key).toBe('demo-invalid-perplexity-key-replace-me');
    for (const v of Object.values(provider_keys)) {
      expect(v?.status).toBe('unverified');
    }
    // enabled_chatbots stays the fresh-install default:
    expect(fixture.settings.enabled_chatbots).toBeNull();
  });

  it('replaces organization + project name/url/hostname with fictional .example placeholders', () => {
    const fixture = buildDemoFixture(fakeHokaLikeLiveRows(), {
      anchor: new Date('2026-08-11T11:00:00.000Z'),
    });

    expect(fixture.organization.name).toBe('Atlas Studio');
    expect(fixture.organization.url).toBe('atlasstudio.example');
    expect(fixture.project.name).toBe('Meridian Run Co.');
    expect(fixture.project.url).toBe('https://meridianrun.example');
    expect(fixture.project.hostname).toBe('meridianrun.example');
  });

  it('replaces every competitor with a fictional pool name and .example URL — never keeps real brand name', () => {
    const fixture = buildDemoFixture(fakeHokaLikeLiveRows(), {
      anchor: new Date('2026-08-11T11:00:00.000Z'),
    });

    expect(fixture.competitors).toHaveLength(5);
    const realBrand = ['Saucony', 'Brooks', 'New Balance', 'Nike', 'ASICS'];
    const blob = JSON.stringify(fixture);
    for (const real of realBrand) {
      expect(blob).not.toContain(real);
    }
    // fictional hostnames all sit under .example (the IANA-reserved fake TLD):
    for (const c of fixture.competitors) {
      expect(c.hostname).toMatch(/\.example$/);
      expect(c.url).toMatch(/^https:\/\/.+\.example$/);
    }
  });

  it('replaces topic and prompt names with fictional pool placeholders — never carries live text verbatim', () => {
    const fixture = buildDemoFixture(fakeHokaLikeLiveRows(), {
      anchor: new Date('2026-08-11T11:00:00.000Z'),
    });

    expect(fixture.topics.map((t) => t.name)).toEqual(['Daily Trainers', 'Race Day Footwear']);
    expect(fixture.prompts.map((p) => p.name)).toEqual([
      'Best everyday running shoes for daily training',
      'Top rated race-day shoes for marathons',
      'Best lightweight shoes for long runs',
      'Most comfortable daily trainers for high mileage',
    ]);
    // Live topic/prompt phrases must NOT survive into the committed fixture text:
    const realPhrases = [
      'Road Running Shoes',
      'Trail Running Shoes',
      'Best cushioned road running shoes for daily training',
      'Top rated road running shoes for long-distance comfort',
      'Best trail running shoes for technical terrain',
      'Grip-focused trail shoes for muddy and uneven paths',
    ];
    const blob = JSON.stringify(fixture);
    for (const phrase of realPhrases) {
      expect(blob).not.toContain(phrase);
    }
  });

  it('synthesises 5 weekly runs (one gap from 6 slots) with a mix of completed + failed', () => {
    const fixture = buildDemoFixture(fakeHokaLikeLiveRows(), {
      anchor: new Date('2026-08-11T11:00:00.000Z'),
    });
    const runs = fixture.collection_runs;

    expect(runs).toHaveLength(5); // 6 slots, 1 gap skipped
    // Anchor (the most recent run) is the most recent Monday 09:00 UTC at or before
    // 2026-08-11T11:00:00Z — that's 2026-08-10T09:00:00Z (Mon).
    expect(new Date(runs[0].started_at!).toISOString()).toBe('2026-08-10T09:00:00.000Z');
    // Statuses:
    expect(runs.map((r) => r.status).sort()).toEqual(['completed', 'completed', 'completed', 'completed', 'failed']);
    // All are app-wide (`scope = 'all'`) so the cadence anchor query picks them up.
    expect(runs.every((r) => r.scope === 'all')).toBe(true);

    // The failed run has items_completed < items_total (partial), others equal.
    const failed = runs.find((r) => r.status === 'failed')!;
    expect(failed.items_completed).toBeLessThan(failed.items_total);
    expect(failed.items_failed).toBeGreaterThan(0);
    expect(failed.error).not.toBeNull();
    for (const r of runs.filter((r) => r.status === 'completed')) {
      expect(r.items_completed).toBe(r.items_total);
      expect(r.items_failed).toBe(0);
      expect(r.error).toBeNull();
    }

    // 12 items/run × 5 runs = 60 run items, every (prompt × chatbot) per run.
    expect(fixture.collection_run_items).toHaveLength(60);
  });

  it('every collection_run_items row references an existing run + prompt; every prompt_response references existing run + prompt', () => {
    const fixture = buildDemoFixture(fakeHokaLikeLiveRows(), {
      anchor: new Date('2026-08-11T11:00:00.000Z'),
    });

    const runIds = new Set(fixture.collection_runs.map((r) => r.id));
    const promptIds = new Set(fixture.prompts.map((p) => p.id));
    const projectId = fixture.project.id;

    for (const item of fixture.collection_run_items) {
      expect(runIds.has(item.run_id)).toBe(true);
      expect(promptIds.has(item.prompt_id)).toBe(true);
      expect(item.project_id).toBe(projectId);
    }

    for (const resp of fixture.prompt_responses) {
      expect(runIds.has(resp.run_id!)).toBe(true);
      expect(promptIds.has(resp.prompt_id)).toBe(true);
      expect(resp.project_id).toBe(projectId);
    }

    // Sources must reference an existing prompt_response:
    const responseIds = new Set(fixture.prompt_responses.map((r) => r.id));
    for (const src of fixture.sources) {
      expect(responseIds.has(src.prompt_response_id)).toBe(true);
    }
  });

  it('only completed runs seed prompt_responses + sources — failed run has items but no responses', () => {
    const fixture = buildDemoFixture(fakeHokaLikeLiveRows(), {
      anchor: new Date('2026-08-11T11:00:00.000Z'),
    });
    const failedRunId = fixture.collection_runs.find((r) => r.status === 'failed')!.id;
    expect(fixture.prompt_responses.filter((r) => r.run_id === failedRunId)).toEqual([]);
    // Every prompt_response has a run_id that points at a completed run:
    const completedRunIds = new Set(
      fixture.collection_runs.filter((r) => r.status === 'completed').map((r) => r.id)
    );
    for (const r of fixture.prompt_responses) {
      expect(completedRunIds.has(r.run_id!)).toBe(true);
    }
  });

  it('refuses multiple projects by snapshotting only the first project and its tree (the demo is single-tenant)', () => {
    const live = fakeHokaLikeLiveRows();
    live.projects.push({
      ...live.projects[0],
      id: '00000000-0000-0000-0000-eeeeeeeeeeee',
      name: 'Second Project',
    });
    const fixture = buildDemoFixture(live, { anchor: new Date('2026-08-11T11:00:00.000Z') });

    // Only the first project row is kept; nothing references the second project's id.
    expect(fixture.project.id).toBe(live.projects[0].id);
    const blob = JSON.stringify(fixture);
    expect(blob).not.toContain('00000000-0000-0000-0000-eeeeeeeeeeee');
    expect(blob).not.toContain('Second Project');
  });
});

describe('seedDemoFromFixture', () => {
  let dbPath: string | undefined;
  let db: AllSearchDatabase | undefined;

  afterEach(() => {
    delete process.env.ALLSEARCH_DB_PATH;
    if (db) closeDatabase(db);
    if (dbPath) cleanupTempDbPath(dbPath);
    db = undefined;
    dbPath = undefined;
  });

  async function freshMigratedDb(): Promise<AllSearchDatabase> {
    dbPath = createTempDbPath('seed-demo');
    process.env.ALLSEARCH_DB_PATH = dbPath;
    const d = await createDatabase(dbPath);
    await migrateDatabase(d, dbPath);
    return d;
  }

  it('inserts every fixture row in a fresh-migrated DB and opens the dashboard gate (org + project rows present)', async () => {
    const fixture = buildDemoFixture(fakeHokaLikeLiveRows(), {
      anchor: new Date('2026-08-11T11:00:00.000Z'),
    });
    db = await freshMigratedDb();

    await seedDemoFromFixture(db, fixture);

    // The onboarding gate looks at "oldest org" + "any project rows" (see
    // app/(private)/layout.tsx). Both must be present:
    const [org] = await db!.all<{ name: string | null }>(
      sql`SELECT name FROM organizations ORDER BY created_at ASC LIMIT 1`
    );
    expect(org).toBeDefined();
    expect(org?.name).toBe('Atlas Studio');
    const [project] = await db!.all<{ name: string }>(sql`SELECT name FROM projects LIMIT 1`);
    expect(project?.name).toBe('Meridian Run Co.');

    // Every fixture row made it into the DB:
    const [cOrg] = await db!.all<{ n: number }>(sql`SELECT count(*) AS n FROM organizations`);
    const [cProj] = await db!.all<{ n: number }>(sql`SELECT count(*) AS n FROM projects`);
    const [cComp] = await db!.all<{ n: number }>(sql`SELECT count(*) AS n FROM competitors`);
    const [cTopics] = await db!.all<{ n: number }>(sql`SELECT count(*) AS n FROM topics`);
    const [cPrompts] = await db!.all<{ n: number }>(sql`SELECT count(*) AS n FROM prompts`);
    const [cRuns] = await db!.all<{ n: number }>(sql`SELECT count(*) AS n FROM collection_runs`);
    const [cItems] = await db!.all<{ n: number }>(
      sql`SELECT count(*) AS n FROM collection_run_items`
    );
    const [cResp] = await db!.all<{ n: number }>(sql`SELECT count(*) AS n FROM prompt_responses`);
    const [cSrc] = await db!.all<{ n: number }>(sql`SELECT count(*) AS n FROM sources`);
    const [cSettings] = await db!.all<{ n: number }>(sql`SELECT count(*) AS n FROM settings`);
    const [cSettingsKeys] = await db!.all<{ keys: string }>(
      sql`SELECT provider_keys AS keys FROM settings WHERE id = 'singleton'`
    );

    expect(cOrg.n).toBe(1);
    expect(cProj.n).toBe(1);
    expect(cComp.n).toBe(fixture.competitors.length);
    expect(cTopics.n).toBe(fixture.topics.length);
    expect(cPrompts.n).toBe(fixture.prompts.length);
    expect(cRuns.n).toBe(fixture.collection_runs.length);
    expect(cItems.n).toBe(fixture.collection_run_items.length);
    expect(cResp.n).toBe(fixture.prompt_responses.length);
    expect(cSrc.n).toBe(fixture.sources.length);
    expect(cSettings.n).toBe(1);
    // The committed fixture's redacted key survived the round-trip:
    expect(JSON.parse(cSettingsKeys.keys).google.key).toBe('demo-invalid-google-key-replace-me');
  });

  it('refuses to seed when the DB already has user data, without touching the existing rows', async () => {
    const fixture = buildDemoFixture(fakeHokaLikeLiveRows(), {
      anchor: new Date('2026-08-11T11:00:00.000Z'),
    });
    db = await freshMigratedDb();
    // Pre-seed a row the user would care about losing:
    await db!.run(sql`INSERT INTO organizations (id, created_at, updated_at, type, name)
                       VALUES ('pre-existing', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', 'agency', 'Real User Org')`);

    await expect(seedDemoFromFixture(db!, fixture)).rejects.toThrow(/already has user data/);

    // Pre-existing data untouched:
    const [row] = await db!.all<{ n: number }>(
      sql`SELECT count(*) AS n FROM organizations WHERE id = 'pre-existing'`
    );
    expect(row?.n).toBe(1);
  });

  it('`force: true` wipes existing user data and seeds the fixture', async () => {
    const fixture = buildDemoFixture(fakeHokaLikeLiveRows(), {
      anchor: new Date('2026-08-11T11:00:00.000Z'),
    });
    db = await freshMigratedDb();
    await db!.run(sql`INSERT INTO organizations (id, created_at, updated_at, type, name)
                       VALUES ('pre-existing', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', 'agency', 'Real User Org')`);

    await seedDemoFromFixture(db!, fixture, { force: true });

    const [row] = await db!.all<{ n: number }>(
      sql`SELECT count(*) AS n FROM organizations WHERE id = 'pre-existing'`
    );
    expect(row?.n).toBe(0); // wiped
    const [project] = await db!.all<{ name: string }>(sql`SELECT name FROM projects LIMIT 1`);
    expect(project?.name).toBe('Meridian Run Co.');
  });

  it('`force: true` wipes a pre-existing `settings` singleton row before seeding the redacted one (no UNIQUE-constraint failure)', async () => {
    const fixture = buildDemoFixture(fakeHokaLikeLiveRows(), {
      anchor: new Date('2026-08-11T11:00:00.000Z'),
    });
    db = await freshMigratedDb();
    // Migrate does NOT insert a settings row (the backfill migration only UPDATEs
    // it); the live app inserts one on first use. Seed a real-but-non-singleton row,
    // simulating a real install's `getOrCreateSettingsRow` having run.
    await db!.run(
      sql`INSERT INTO settings (id, created_at, updated_at, provider_keys)
          VALUES ('live-install-id', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z',
                  '{"google":{"key":"REAL-SECRET-live-key","status":"valid","validatedAt":"now"}}')`
    );

    // The fixture's redacted settings.id is 'singleton' — collides with no live
    // row id here, but only because the live one used a different UUID. The point
    // of including `settings` in the wipe list is that on --force the live install's
    // settings row must go away, then the seed's singleton insert is unique.
    await seedDemoFromFixture(db!, fixture, { force: true });

    const [row] = await db!.all<{ n: number }>(sql`SELECT count(*) AS n FROM settings`);
    expect(row?.n).toBe(1);
    const [singleton] = await db!.all<{ id: string; keys: string }>(
      sql`SELECT id, provider_keys AS keys FROM settings`
    );
    expect(singleton?.id).toBe('singleton');
    expect(singleton.keys).not.toContain('REAL-SECRET-live-key');
    expect(singleton.keys).toContain('demo-invalid-google-key-replace-me');
  });
});

describe('scripts/fixtures/demo-data.json (committed fixture)', () => {
  it('exists and is the current version with the expected redactions', async () => {
    const { readFileSync } = await import('node:fs');
    const path = await import('node:path');
    const fixturePath = path.resolve(process.cwd(), 'scripts', 'fixtures', 'demo-data.json');
    const fixture = JSON.parse(readFileSync(fixturePath, 'utf-8')) as DemoFixture;

    expect(fixture.version).toBe(1);
    // Redactions hold in the committed file:
    const blob = JSON.stringify(fixture);
    expect(blob).not.toContain('REAL-SECRET');
    for (const realBrand of ['Hoka', 'Saucony', 'Nike', 'ASICS', 'Tugulab']) {
      expect(blob).not.toContain(realBrand);
    }
    // dashboard gate can open with committed fixture:
    expect(fixture.organization.id).toBeTruthy();
    expect(fixture.project.id).toBeTruthy();
    // Synthetic history is present: exactly 5 runs (6 weekly slots, 1 gap),
    // with at least one failed + at least one completed (Q8).
    expect(fixture.collection_runs).toHaveLength(5);
    expect(fixture.collection_runs.filter((r) => r.status === 'completed').length).toBe(4);
    expect(fixture.collection_runs.filter((r) => r.status === 'failed').length).toBe(1);
    // Started_at timestamps are distinct weeks (the gap is enforced by missing one
    // slot between weeks): snapshots the run startedAts as ISO date-strings and
    // asserts they're 7 days apart in their set.
    const weekStarts = fixture.collection_runs
      .map((r) => r.started_at!.slice(0, 10))
      .sort();
    expect(weekStarts).toHaveLength(5);
    // Distinct weeks, and the gap shows up as >7 days between two consecutive
    // entries after sorting.
    const days = weekStarts.map((d) => Date.parse(d) / 86_400_000);
    let maxGap = 0;
    for (let i = 1; i < days.length; i++) maxGap = Math.max(maxGap, days[i] - days[i - 1]);
    expect(maxGap).toBeGreaterThan(7); // gap week
    // Synthetic history should not contain any nullable timestamps or zeros:
    for (const r of fixture.collection_runs) {
      expect(r.started_at).toBeTruthy();
      if (r.status !== 'running') expect(r.finished_at).toBeTruthy();
    }
  });
});