export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { getDatabase } = await import('./libs/database/client');
  const { migrateDatabase } = await import('./libs/database/migrate');
  const { getDatabasePath } = await import('./libs/database/paths');

  const db = await getDatabase();
  await migrateDatabase(db, getDatabasePath());
}
