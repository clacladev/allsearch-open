import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: isCI ? 1 : 0,
  workers: 3,
  grepInvert: process.env.PLAYWRIGHT_INCLUDE_AI ? undefined : /@ai/,
  reporter: isCI
    ? [
        ['list'],
        ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
        ['html', { open: 'never' }],
      ]
    : 'list',
  use: {
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.01 },
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /visual\//,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual-light',
      testMatch: /visual\//,
      use: { ...devices['Desktop Chrome'], colorScheme: 'light' },
    },
    {
      name: 'visual-dark',
      testMatch: /visual\//,
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark' },
    },
    {
      // A Chromium-based device profile (not iPhone/WebKit) so the mobile
      // project needs no browser binary beyond the chromium already
      // installed for the other projects.
      name: 'visual-mobile',
      testMatch: /visual\//,
      use: { ...devices['Pixel 7'] },
    },
  ],
});
