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
      testIgnore: /collection-run-progress\.spec\.ts/,
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
      name: 'chromium-no-auth',
      testMatch: /collection-run-progress\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
