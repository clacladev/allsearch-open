import { NextRequest, NextResponse } from 'next/server';
import { retryFailedCollectionRunItems } from '@/libs/collection';
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
    const run = await retryFailedCollectionRunItems(runId);
    return NextResponse.json({ runId: run.id, status: run.status });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
