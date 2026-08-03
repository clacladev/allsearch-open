import { NextResponse } from 'next/server';
import { createCollectionRun, ensureCollectionRunLoopIsRunning } from '@/libs/collection';

export async function POST() {
  try {
    const run = await createCollectionRun();
    ensureCollectionRunLoopIsRunning();

    return Response.json({ message: 'Collection Run started', runId: run.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
