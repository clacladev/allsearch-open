import { sql } from 'drizzle-orm';
import { expect, test } from '../helpers/test';
import { createDatabase } from '../../../libs/database/client';

async function archiveProjects(databasePath: string): Promise<void> {
  const db = await createDatabase(databasePath);
  try {
    await db.run(sql`UPDATE projects SET is_archived = 1`);
  } finally {
    (db as unknown as { $client: { close(): void } }).$client.close();
  }
}

test.describe('Dashboard empty state — visual baseline', () => {
  test('captures the migrated empty state', async ({ page, e2eServer }, testInfo) => {
    test.setTimeout(30_000);
    await archiveProjects(e2eServer.databasePath);
    await page.goto('/dashboard');
    await expect(page.getByText('No active projects', { exact: true })).toBeVisible();

    const expectedThemeClass = testInfo.project.name === 'visual-dark' ? 'dark-mode' : 'light-mode';
    await expect(page.locator('html')).toHaveClass(new RegExp(expectedThemeClass));
    await expect(page).toHaveScreenshot('dashboard-empty.png');
  });
});
