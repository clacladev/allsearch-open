import 'server-only';

import { and, asc, eq, getTableColumns } from 'drizzle-orm';

import { getDatabase } from '../client';
import { prompts, topics } from '../schema';
import { PromptAndTopicJoinRow, PromptRow } from './types';

type InsertPromptRowInput = Omit<PromptRow, 'id' | 'is_archived' | 'created_at' | 'updated_at'> & {
  created_at?: string;
};

type UpdatePromptRowInput = Partial<Omit<PromptRow, 'id' | 'created_at' | 'updated_at'>>;

export async function getPromptRowWithId(id: string): Promise<PromptRow | undefined> {
  const db = await getDatabase();
  const rows = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);
  return rows[0];
}

export async function getPromptRowsWithProjectId(
  project_id: string,
  includeArchived = false
): Promise<PromptRow[]> {
  const db = await getDatabase();
  const conditions = [eq(prompts.project_id, project_id)];
  if (!includeArchived) conditions.push(eq(prompts.is_archived, false));
  return db
    .select()
    .from(prompts)
    .where(and(...conditions))
    .orderBy(asc(prompts.updated_at));
}

export async function getPromptAndTopicJoinWithProjectId(
  project_id: string,
  includeArchived = false
): Promise<PromptAndTopicJoinRow[]> {
  const db = await getDatabase();
  const conditions = [eq(prompts.project_id, project_id)];
  if (!includeArchived) conditions.push(eq(prompts.is_archived, false));
  const rows = await db
    .select({ ...getTableColumns(prompts), topic_name: topics.name })
    .from(prompts)
    .leftJoin(topics, eq(prompts.topic_id, topics.id))
    .where(and(...conditions))
    .orderBy(asc(prompts.created_at), asc(prompts.is_archived));
  return rows as PromptAndTopicJoinRow[];
}

export async function insertPromptRow(input: InsertPromptRowInput): Promise<PromptRow> {
  const db = await getDatabase();
  const [row] = await db.insert(prompts).values(input).returning();
  if (!row) throw new Error('Insert into prompts returned no row');
  return row;
}

export async function insertPromptRows(inputs: InsertPromptRowInput[]): Promise<PromptRow[]> {
  const db = await getDatabase();
  return db.insert(prompts).values(inputs).returning();
}

export async function updatePromptRowWithId(
  id: string,
  values: UpdatePromptRowInput
): Promise<PromptRow> {
  const db = await getDatabase();
  const [row] = await db.update(prompts).set(values).where(eq(prompts.id, id)).returning();
  if (!row) throw new Error(`No prompts row found for id ${id}`);
  return row;
}

export async function deletePromptRowsWithProjectId(projectId: string): Promise<PromptRow[]> {
  const db = await getDatabase();
  return db.delete(prompts).where(eq(prompts.project_id, projectId)).returning();
}
