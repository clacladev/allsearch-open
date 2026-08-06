import { NextResponse } from 'next/server';
import {
  getCollectionCadenceAnchor,
  getLatestTerminalCollectionRunRow,
} from '@/libs/database/CollectionRuns/queries';
import { countDistinctFailedPromptsForRun } from '@/libs/database/CollectionRunItems/queries';
import type { CollectionCadenceResponse } from './types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Deliberately does not report whether a Run is active — the client already knows that from the
// shared progress hook (CollectionRunContext).
export async function GET() {
  try {
    const anchor = await getCollectionCadenceAnchor();
    const lastCompletedRunFinishedAt = anchor?.finishedAt ?? null;
    const lastCompletedRunId = anchor?.runId ?? null;
    const terminalRun = await getLatestTerminalCollectionRunRow();

    let failedRun: CollectionCadenceResponse['failedRun'] = null;
    if (terminalRun) {
      const failedPromptCount = await countDistinctFailedPromptsForRun(terminalRun.id);
      if (failedPromptCount > 0) failedRun = { runId: terminalRun.id, failedPromptCount };
    }

    const body: CollectionCadenceResponse = { lastCompletedRunFinishedAt, lastCompletedRunId, failedRun };
    return NextResponse.json(body);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
