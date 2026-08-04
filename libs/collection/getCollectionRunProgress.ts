import 'server-only';

import { getCollectionRunRowWithId } from '@/libs/database/CollectionRuns/queries';
import { CollectionRunStatus } from '@/libs/database/CollectionRuns/types';
import { getCollectionRunItemProgressRowsForRun } from '@/libs/database/CollectionRunItems/queries';
import { buildCollectionRunProgress, type CollectionRunProgress } from './progress';

export async function getCollectionRunProgress(
  runId: string
): Promise<CollectionRunProgress | undefined> {
  const run = await getCollectionRunRowWithId(runId);
  if (!run) return undefined;

  const rows = await getCollectionRunItemProgressRowsForRun(runId);
  return buildCollectionRunProgress({ id: run.id, status: run.status as CollectionRunStatus }, rows);
}
