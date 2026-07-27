import { NextRequest, NextResponse } from 'next/server';
import { getUserOrThrow } from '@/libs/database/supabase/server';
import { getUserProfileRowWithId } from '@/libs/database/UserProfiles/queries';
import { getProjectRowWithId, deleteProjectRowCascade } from '@/libs/database/Projects/queries';

export async function POST(
  _req: NextRequest,
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

    if (!projectRow.is_archived) {
      return NextResponse.json(
        { error: 'Only archived projects can be permanently deleted' },
        { status: 400 }
      );
    }

    await deleteProjectRowCascade(projectId, { asAdmin: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
