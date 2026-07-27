import { NextResponse, NextRequest } from 'next/server';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import { getPostHogServer, searchParamsToObject } from '@/libs/posthog';
import { getUserProfileRowWithId } from '@/libs/database/UserProfiles/queries';
import { getProjectRowWithId, updateProjectRow } from '@/libs/database/Projects/queries';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const user = await getUserOrThrow();
    const userProfile = await getUserProfileRowWithId(user.id, { asAdmin: true });
    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const projectRow = await getProjectRowWithId(projectId, undefined, { asAdmin: true });
    if (!projectRow) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updatedProject = await updateProjectRow(
      projectId,
      { is_paused: !projectRow.is_paused },
      { asAdmin: true }
    );

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error(error);
    getPostHogServer().captureException(
      error,
      await getUserId(),
      searchParamsToObject(req.nextUrl.searchParams)
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
