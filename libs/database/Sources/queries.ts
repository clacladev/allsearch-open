import 'server-only';

import { and, asc, eq, gte, inArray, lt } from 'drizzle-orm';

import { getDatabase } from '../client';
import { sources } from '../schema';
import { SourceRow, SourceSummaryRow } from './types';
import { ISODateString, getISODateString } from '../shared/ISODateString';

const SOURCE_SUMMARY_COLUMNS = {
  id: sources.id,
  created_at: sources.created_at,
  project_id: sources.project_id,
  prompt_id: sources.prompt_id,
  prompt_response_id: sources.prompt_response_id,
  is_cited: sources.is_cited,
  position: sources.position,
  clean_url: sources.clean_url,
  url: sources.url,
  hostname: sources.hostname,
  title: sources.title,
  brand_ids_ranking: sources.brand_ids_ranking,
};

type InsertSourceRowInput = Omit<SourceRow, 'id' | 'created_at'> & { created_at?: string };

export async function insertSourceRows(inputs: InsertSourceRowInput[]): Promise<SourceRow[]> {
  if (!inputs.length) return [];
  const db = await getDatabase();
  return db.insert(sources).values(inputs).returning();
}

export async function getSourceRowsWithPromptResponseIds(
  promptResponseIds: string[]
): Promise<SourceRow[]> {
  if (!promptResponseIds.length) return [];
  const db = await getDatabase();
  return db
    .select()
    .from(sources)
    .where(inArray(sources.prompt_response_id, promptResponseIds))
    .orderBy(asc(sources.position));
}

export async function getSourceRowsWithProjectIdInDateRange(
  projectId: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString
): Promise<SourceRow[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(sources)
    .where(
      and(
        eq(sources.project_id, projectId),
        gte(sources.created_at, startDateISO),
        lt(sources.created_at, getISODateString(endDateISO, 1))
      )
    )
    .orderBy(asc(sources.position));
}

export async function getSourceSummaryRowsWithProjectIdInDateRange(
  projectId: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString
): Promise<SourceSummaryRow[]> {
  const db = await getDatabase();
  return db
    .select(SOURCE_SUMMARY_COLUMNS)
    .from(sources)
    .where(
      and(
        eq(sources.project_id, projectId),
        gte(sources.created_at, startDateISO),
        lt(sources.created_at, getISODateString(endDateISO, 1))
      )
    )
    .orderBy(asc(sources.position));
}

export async function getSourceRowsWithProjectId(projectId: string): Promise<SourceRow[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(sources)
    .where(eq(sources.project_id, projectId))
    .orderBy(asc(sources.created_at));
}

export async function deleteSourceRowsWithPromptIds(
  promptIds: string[],
  projectId: string
): Promise<void> {
  if (!promptIds.length) return;
  const db = await getDatabase();
  await db
    .delete(sources)
    .where(and(inArray(sources.prompt_id, promptIds), eq(sources.project_id, projectId)));
}

export async function deleteSourceRowsWithProjectId(projectId: string): Promise<void> {
  const db = await getDatabase();
  await db.delete(sources).where(eq(sources.project_id, projectId));
}

export async function deleteSourceRowsWithPromptResponseIds(
  promptResponseIds: string[]
): Promise<void> {
  if (!promptResponseIds.length) return;
  const db = await getDatabase();
  await db.delete(sources).where(inArray(sources.prompt_response_id, promptResponseIds));
}
