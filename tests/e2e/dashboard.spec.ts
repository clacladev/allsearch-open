import { sql } from 'drizzle-orm';
import { expect, test } from './helpers/test';
import { createDatabase } from '../../libs/database/client';

async function archiveProjects(databasePath: string): Promise<void> {
  const db = await createDatabase(databasePath);
  try {
    await db.run(sql`UPDATE projects SET is_archived = 1`);
  } finally {
    (db as unknown as { $client: { close(): void } }).$client.close();
  }
}

test.describe('Dashboard page', () => {
  test('shows semantic empty-state controls when every project is archived', async ({
    page,
    e2eServer,
  }) => {
    test.setTimeout(30_000);
    await archiveProjects(e2eServer.databasePath);

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('No active projects', { exact: true })).toBeVisible();
    await expect(
      page.getByText(
        'All your projects have been archived. Create a new project to get started again.'
      )
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'New project' })).toBeVisible();
  });
});
