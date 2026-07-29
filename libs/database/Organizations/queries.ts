import 'server-only';

import { asc, eq } from 'drizzle-orm';

import { getDatabase } from '../client';
import { organizations } from '../schema';
import { OrganizationRow } from './types';

type InsertOrganizationRowInput = Omit<OrganizationRow, 'id' | 'created_at' | 'updated_at'>;

export async function getOrganizationRowWithId(id: string): Promise<OrganizationRow | undefined> {
  const db = await getDatabase();
  const rows = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return rows[0];
}

export async function getOrganization(): Promise<OrganizationRow | undefined> {
  const db = await getDatabase();
  const rows = await db.select().from(organizations).orderBy(asc(organizations.created_at)).limit(1);
  return rows[0];
}

export async function insertOrganizationRow(
  input: InsertOrganizationRowInput
): Promise<OrganizationRow> {
  const db = await getDatabase();
  const [row] = await db.insert(organizations).values(input).returning();
  if (!row) throw new Error('Insert into organizations returned no row');
  return row;
}

export async function updateOrganizationRow(
  id: string,
  values: Partial<InsertOrganizationRowInput>
): Promise<OrganizationRow> {
  const db = await getDatabase();
  const [row] = await db
    .update(organizations)
    .set(values)
    .where(eq(organizations.id, id))
    .returning();
  if (!row) throw new Error(`No organizations row found for id ${id}`);
  return row;
}
