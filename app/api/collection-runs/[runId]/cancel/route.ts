import { NextRequest, NextResponse } from 'next/server';
import { cancelCollectionRun } from '@/libs/collection';
import { getCollectionRunRowWithId } from '@/libs/database/CollectionRuns/queries';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const existing = await getCollectionRunRowWithId(runId);
    if (!existing) {
      return NextResponse.json({ error: 'Collection Run not found' }, { status: 404 });
    }
    const run = await cancelCollectionRun(runId);
    return NextResponse.json({ runId: run.id, status: run.status });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to cancel collection run' },
      { status: 500 }
    );
  }
}
