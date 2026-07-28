import 'server-only';

import { and, eq } from 'drizzle-orm';

import { getDatabase } from '../client';
import { topics } from '../schema';
import { TopicRow } from './types';

type InsertTopicRowInput = Omit<TopicRow, 'id' | 'is_archived' | 'created_at' | 'updated_at'> & {
  created_at?: string;
};

export async function getTopicRowWithId(id: string): Promise<TopicRow | undefined> {
  const db = await getDatabase();
  const rows = await db.select().from(topics).where(eq(topics.id, id)).limit(1);
  return rows[0];
}

export async function getTopicRowsWithProjectId(
  project_id: string,
  includeArchived = false
): Promise<TopicRow[]> {
  const db = await getDatabase();
  const conditions = [eq(topics.project_id, project_id)];
  if (!includeArchived) conditions.push(eq(topics.is_archived, false));
  return db
    .select()
    .from(topics)
    .where(and(...conditions));
}

export async function insertTopicRow(input: InsertTopicRowInput): Promise<TopicRow> {
  const db = await getDatabase();
  const [row] = await db.insert(topics).values(input).returning();
  if (!row) throw new Error('Insert into topics returned no row');
  return row;
}

export async function updateTopicRow(
  id: string,
  input: Partial<Pick<TopicRow, 'name' | 'is_archived'>>
): Promise<TopicRow> {
  const db = await getDatabase();
  const [row] = await db.update(topics).set(input).where(eq(topics.id, id)).returning();
  if (!row) throw new Error(`No topics row found for id ${id}`);
  return row;
}

export async function insertTopicRows(inputs: InsertTopicRowInput[]): Promise<TopicRow[]> {
  const db = await getDatabase();
  return db.insert(topics).values(inputs).returning();
}

export async function deleteTopicRowsWithProjectId(projectId: string): Promise<TopicRow[]> {
  const db = await getDatabase();
  return db.delete(topics).where(eq(topics.project_id, projectId)).returning();
}
