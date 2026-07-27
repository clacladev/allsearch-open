import { fetchDailyPromptsWorkflow } from '@/libs/workflows/fetchDailyPrompts';
import { start } from 'workflow/api';
import { getTodayISODateString } from '@/libs/database/shared/ISODateString';

export async function GET(req: Request) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const today = getTodayISODateString();
  const run = await start(fetchDailyPromptsWorkflow, [today]);

  return Response.json({
    message: `Workflow 'fetchDailyPromptsWorkflow' started`,
    runId: run.runId,
  });
}
