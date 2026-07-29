import 'server-only';

import { and, asc, eq } from 'drizzle-orm';

import { getDatabase } from '../client';
import { competitors } from '../schema';
import { CompetitorRow } from './types';

type InsertCompetitorRowInput = Omit<
  CompetitorRow,
  'id' | 'is_archived' | 'created_at' | 'updated_at'
> & { created_at?: string };

type UpdateCompetitorRowInput = Partial<Omit<CompetitorRow, 'id' | 'created_at' | 'updated_at'>>;

export async function getCompetitorRowWithId(id: string): Promise<CompetitorRow | undefined> {
  const db = await getDatabase();
  const rows = await db.select().from(competitors).where(eq(competitors.id, id)).limit(1);
  return rows[0];
}

export async function getCompetitorRowsWithProjectId(project_id: string): Promise<CompetitorRow[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(competitors)
    .where(eq(competitors.project_id, project_id))
    .orderBy(asc(competitors.updated_at));
}

export async function getActiveCompetitorRowsWithProjectId(
  project_id: string
): Promise<CompetitorRow[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(competitors)
    .where(and(eq(competitors.project_id, project_id), eq(competitors.is_archived, false)))
    .orderBy(asc(competitors.updated_at));
}

export async function insertCompetitorRow(input: InsertCompetitorRowInput): Promise<CompetitorRow> {
  const db = await getDatabase();
  const [row] = await db.insert(competitors).values(input).returning();
  if (!row) throw new Error('Insert into competitors returned no row');
  return row;
}

export async function insertCompetitorRows(
  inputs: InsertCompetitorRowInput[]
): Promise<CompetitorRow[]> {
  const db = await getDatabase();
  return db.insert(competitors).values(inputs).returning();
}

export async function updateCompetitorRowWithId(
  id: string,
  values: UpdateCompetitorRowInput
): Promise<CompetitorRow> {
  const db = await getDatabase();
  const [row] = await db.update(competitors).set(values).where(eq(competitors.id, id)).returning();
  if (!row) throw new Error(`No competitors row found for id ${id}`);
  return row;
}
