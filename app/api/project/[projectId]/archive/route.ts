import { NextRequest, NextResponse } from 'next/server';
import { getProjectRowWithId, updateProjectRow } from '@/libs/database/Projects/queries';
import { z } from 'zod';

const ArchiveProjectBodySchema = z.object({
  action: z.enum(['archive', 'restore']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const bodyResult = ArchiveProjectBodySchema.safeParse(await req.json());
    if (!bodyResult.success) {
      return NextResponse.json(
        { error: bodyResult.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      );
    }
    const { action } = bodyResult.data;

    const projectRow = await getProjectRowWithId(projectId);
    if (!projectRow) {
      throw new Error('Failed to get project');
    }

    const updatedProject = await updateProjectRow(projectId, { is_archived: action === 'archive' });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
