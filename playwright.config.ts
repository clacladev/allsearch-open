import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const authFile = 'tests/e2e/.auth/user.json';

export default defineConfig({
  testDir: './tests/e2e',
  // Each spec file runs sequentially within itself (fullyParallel: false), but the
  // three spec files run concurrently across workers. 3 matches the number of spec files.
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  workers: 3,
  reporter: isCI
    ? [
        ['list'],
        ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
        ['html', { open: 'never' }],
      ]
    : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'https://localhost:3000',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      testIgnore: /(collection-run-progress|first-run)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
    {
      // This app has no auth and no middleware, so this spec runs against a plain dev server
      // without the Supabase magic-link setup the `chromium` project depends on (issue 21 owns
      // fixing that setup; this project is a deliberate carve-out, not a workaround for it).
      //
      // There is deliberately no `webServer` here: the app needs a migrated per-install SQLite
      // database (and, for other specs, provider config) that Playwright cannot bootstrap on its
      // own, and no other project in this file uses `webServer` either — the established
      // convention is a dev server started by hand. Run it with:
      //   bun run dev
      //   PLAYWRIGHT_BASE_URL=http://localhost:<port> bunx playwright test --project=chromium-no-auth
      // `PLAYWRIGHT_BASE_URL` is optional: this project's `baseURL` (above) already falls back to
      // `https://localhost:3000`, what `bun run dev` serves.
      name: 'chromium-no-auth',
      testMatch: /collection-run-progress\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // tests/e2e/first-run.spec.ts asserts DB-gated redirects (no provider key, no organization)
      // for a fresh-install state the seeded suite database used by the other projects can never
      // be in — it needs its own dev server pointed at a throwaway `ALLSEARCH_DB_PATH` that this
      // project's tests are free to wipe. No auth, no `storageState`, no `dependencies`, same
      // hand-started-dev-server convention as `chromium-no-auth` above. Run it with:
      //   ALLSEARCH_DB_PATH=/tmp/allsearch-e2e/allsearch.db bun run dev
      //   ALLSEARCH_DB_PATH=/tmp/allsearch-e2e/allsearch.db bunx playwright test --project=chromium-fresh-install
      name: 'chromium-fresh-install',
      testMatch: /first-run\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
