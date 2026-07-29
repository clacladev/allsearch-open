import { test, expect } from '@playwright/test';
import { TEST_PROJECT_ID } from './constants';
import { authenticate } from './helpers/auth';

// Override the project-level storageState so this test always starts unauthenticated.
test.use({ storageState: { cookies: [], origins: [] } });

test('can authenticate from homepage with test user', async ({ page }) => {
  await authenticate(page);
  await expect(page).toHaveURL(`/project/${TEST_PROJECT_ID}`);
});
