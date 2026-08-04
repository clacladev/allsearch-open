import { NextResponse } from 'next/server';
import { getActiveCollectionRunRow } from '@/libs/database/CollectionRuns/queries';
import type { ActiveCollectionRunResponse } from './types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const run = await getActiveCollectionRunRow();
    const body: ActiveCollectionRunResponse = { runId: run?.id ?? null };
    return NextResponse.json(body);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
