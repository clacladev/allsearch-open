import { fetchDailyPromptsForProjectWorkflow } from '@/libs/workflows/fetchDailyPromptsForProject';
import { start } from 'workflow/api';
import { getTodayISODateString } from '@/libs/database/shared/ISODateString';

const MAX_PROMPTS = 1;
const SHOULD_FORCE = true;

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!projectId) return new Response('Missing projectId', { status: 400 });

  const today = getTodayISODateString();
  const run = await start(fetchDailyPromptsForProjectWorkflow, [
    projectId,
    today,
    MAX_PROMPTS,
    SHOULD_FORCE,
  ]);

  return Response.json({
    message: `Workflow 'fetchDailyPromptsForProjectWorkflow' started`,
    runId: run.runId,
  });
}
