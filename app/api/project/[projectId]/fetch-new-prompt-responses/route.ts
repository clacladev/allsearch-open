import { NextResponse, NextRequest } from 'next/server';
import { fetchDailyPromptsForProjectWorkflow } from '@/libs/workflows/fetchDailyPromptsForProject';
import { getTodayISODateString } from '@/libs/database/shared/ISODateString';
import { start } from 'workflow/api';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const today = getTodayISODateString();
    const run = await start(fetchDailyPromptsForProjectWorkflow, [projectId, today]);

    return Response.json({
      message: `Workflow 'fetchDailyPromptsForProjectWorkflow' started`,
      runId: run.runId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
