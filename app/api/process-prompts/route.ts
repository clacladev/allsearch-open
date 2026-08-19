import { NextResponse } from 'next/server';
import { createCollectionRun, ensureCollectionRunLoopIsRunning } from '@/libs/collection';
import { getActiveCollectionRunRow } from '@/libs/database/CollectionRuns/queries';

export async function POST() {
  try {
    // Criterion 13: the refresh button must never be able to start a second overlapping Run. This
    // is a no-op, not an error — the caller gets the Run that is already in flight. Deliberately
    // only on the app-wide route: the per-Project route and new-Project creation must still be
    // able to start a Run for a single Project while another is in flight.
    const activeRun = await getActiveCollectionRunRow();
    if (activeRun) {
      ensureCollectionRunLoopIsRunning();
      return Response.json({ message: 'A Collection Run is already in progress', runId: activeRun.id });
    }

    const run = await createCollectionRun();
    ensureCollectionRunLoopIsRunning();

    return Response.json({ message: 'Collection Run started', runId: run.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process prompts' }, { status: 500 });
  }
}
