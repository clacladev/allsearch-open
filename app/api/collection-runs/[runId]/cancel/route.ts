import { NextRequest, NextResponse } from 'next/server';
import { cancelCollectionRun } from '@/libs/collection';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const run = await cancelCollectionRun(runId);
    return NextResponse.json({ runId: run.id, status: run.status });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
