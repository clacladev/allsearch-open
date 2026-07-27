import { fetchDailyPromptsForProjectWorkflow } from '@/libs/workflows/fetchDailyPromptsForProject';
import { start } from 'workflow/api';
import { getTodayISODateString } from '@/libs/database/shared/ISODateString';
import { getUserOrThrow } from '@/libs/database/supabase/server';
import { getUserProfileRowWithId } from '@/libs/database/UserProfiles/queries';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  if (!projectId) return new Response('Missing projectId', { status: 400 });
  const shouldForce = req.nextUrl.searchParams.get('shouldForce');

  const user = await getUserOrThrow();
  const userProfile = await getUserProfileRowWithId(user.id);
  if (!userProfile) throw new Error('User profile not found');
  if (userProfile.role !== 'admin') return new Response('Unauthorized', { status: 401 });

  const today = getTodayISODateString();
  const run = await start(fetchDailyPromptsForProjectWorkflow, [
    projectId,
    today,
    undefined,
    shouldForce === 'true',
  ]);

  return Response.json({
    message: `Workflow 'fetchDailyPromptsForProjectWorkflow' started`,
    runId: run.runId,
  });
}
