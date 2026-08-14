import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { test, expect, _electron as electron } from '@playwright/test';

test('desktop shell loads the local app and keeps the configured database path', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'allsearch-desktop-'));
  const databasePath = join(directory, 'allsearch.db');
  writeFileSync(databasePath, '');
  const app = await electron.launch({
    args: [resolve(process.cwd(), 'dist', 'desktop', 'main.cjs')],
    env: { ...process.env, ALLSEARCH_DB_PATH: databasePath },
  });
  try {
    const page = await app.firstWindow();
    await expect(page).toHaveURL(/http:\/\/127\.0\.0\.1:\d+\//);
    await expect(page.locator('body')).not.toBeEmpty();
  } finally {
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
