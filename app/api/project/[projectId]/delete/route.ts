import { NextRequest, NextResponse } from 'next/server';
import { getProjectRowWithId, deleteProjectRow } from '@/libs/database/Projects/queries';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const projectRow = await getProjectRowWithId(projectId);
    if (!projectRow) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!projectRow.is_archived) {
      return NextResponse.json(
        { error: 'Only archived projects can be permanently deleted' },
        { status: 400 }
      );
    }

    await deleteProjectRow(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
