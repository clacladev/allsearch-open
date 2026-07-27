import { NextResponse, NextRequest } from 'next/server';
import { getUserOrThrow } from '@/libs/database/supabase/server';
import { updateLastDayOfPromptResponsesAnalysis } from '@/libs/workflows/updateLastDayOfPromptResponsesAnalysis';
import { start } from 'workflow/api';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const user = await getUserOrThrow();
    const run = await start(updateLastDayOfPromptResponsesAnalysis, [projectId, user.id]);

    return Response.json({
      message: `Workflow 'updateLastDayOfPromptResponsesAnalysis' started`,
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
