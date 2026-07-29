import 'server-only';

import { and, asc, desc, eq, gte, inArray, lt } from 'drizzle-orm';

import { getDatabase } from '../client';
import { promptResponses } from '../schema';
import { deleteSourceRowsWithPromptIds, deleteSourceRowsWithProjectId } from '../Sources/queries';
import { ISODateString, getISODateString } from '../shared/ISODateString';
import { PromptResponseRow, PromptResponseSummaryRow } from './types';

type InsertPromptResponseRowInput = Omit<PromptResponseRow, 'id' | 'created_at'> & {
  created_at?: string;
};

export async function getPromptResponseRowWithId(
  id: string
): Promise<PromptResponseRow | undefined> {
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(promptResponses)
    .where(eq(promptResponses.id, id))
    .limit(1);
  return rows[0];
}

export async function getPromptResponseRowsWithProjectIdInDateRange(
  project_id: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString
): Promise<PromptResponseRow[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(promptResponses)
    .where(
      and(
        eq(promptResponses.project_id, project_id),
        gte(promptResponses.created_at, startDateISO),
        lt(promptResponses.created_at, getISODateString(endDateISO, 1)) // Add a day to include the full endDate day in the range
      )
    )
    .orderBy(desc(promptResponses.created_at));
}

const SUMMARY_COLUMNS = {
  id: promptResponses.id,
  brand_ids_ranking: promptResponses.brand_ids_ranking,
  sentiment: promptResponses.sentiment,
  chatbot_id: promptResponses.chatbot_id,
  prompt_id: promptResponses.prompt_id,
  created_at: promptResponses.created_at,
};

export async function getPromptResponseSummaryRowsWithProjectIdInDateRange(
  project_id: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString
): Promise<PromptResponseSummaryRow[]> {
  const db = await getDatabase();
  return db
    .select(SUMMARY_COLUMNS)
    .from(promptResponses)
    .where(
      and(
        eq(promptResponses.project_id, project_id),
        gte(promptResponses.created_at, startDateISO),
        lt(promptResponses.created_at, getISODateString(endDateISO, 1))
      )
    )
    .orderBy(desc(promptResponses.created_at));
}

export async function getPromptResponseRowsWithPromptIdInDateRange(
  prompt_id: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString
): Promise<PromptResponseRow[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(promptResponses)
    .where(
      and(
        eq(promptResponses.prompt_id, prompt_id),
        gte(promptResponses.created_at, startDateISO),
        lt(promptResponses.created_at, getISODateString(endDateISO, 1)) // Add a day to include the full endDate day in the range
      )
    )
    .orderBy(desc(promptResponses.created_at));
}

export async function getPromptResponseRowsWithProjectId(
  project_id: string
): Promise<PromptResponseRow[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(promptResponses)
    .where(eq(promptResponses.project_id, project_id))
    .orderBy(asc(promptResponses.created_at));
}

export async function insertPromptResponseRow(
  input: InsertPromptResponseRowInput
): Promise<PromptResponseRow> {
  const db = await getDatabase();
  const [row] = await db.insert(promptResponses).values(input).returning();
  if (!row) throw new Error('Insert into prompt_responses returned no row');
  return row;
}

export async function insertPromptResponseRows(
  inputs: InsertPromptResponseRowInput[]
): Promise<PromptResponseRow[]> {
  const db = await getDatabase();
  return db.insert(promptResponses).values(inputs).returning();
}

export async function updatePromptResponseRowWithId(
  id: string,
  values: Partial<InsertPromptResponseRowInput>
): Promise<PromptResponseRow> {
  const db = await getDatabase();
  const [row] = await db
    .update(promptResponses)
    .set(values)
    .where(eq(promptResponses.id, id))
    .returning();
  if (!row) throw new Error(`No prompt_responses row found for id ${id}`);
  return row;
}

export async function deletePromptResponseRowsWithPromptIds(
  promptIds: string[],
  projectId: string
): Promise<PromptResponseRow[]> {
  // Delete from sources first (FK constraint)
  await deleteSourceRowsWithPromptIds(promptIds, projectId);

  const db = await getDatabase();
  return db
    .delete(promptResponses)
    .where(
      and(inArray(promptResponses.prompt_id, promptIds), eq(promptResponses.project_id, projectId))
    )
    .returning();
}

export async function deletePromptResponseRowsWithProjectId(
  projectId: string
): Promise<PromptResponseRow[]> {
  // Delete from sources first (FK constraint)
  await deleteSourceRowsWithProjectId(projectId);

  const db = await getDatabase();
  return db.delete(promptResponses).where(eq(promptResponses.project_id, projectId)).returning();
}
