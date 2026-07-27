import { test as setup } from '@playwright/test';
import { authenticate } from './helpers/auth';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await authenticate(page);
  await page.context().storageState({ path: authFile });
});
