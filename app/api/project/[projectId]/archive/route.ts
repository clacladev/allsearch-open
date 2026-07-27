import { NextRequest, NextResponse } from 'next/server';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import { getPostHogServer, searchParamsToObject } from '@/libs/posthog';
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

    const user = await getUserOrThrow();

    const projectRow = await getProjectRowWithId(projectId);
    if (!projectRow || projectRow.author_id !== user.id) {
      throw new Error('Failed to get project');
    }

    const updatedProject = await updateProjectRow(
      projectId,
      { is_archived: action === 'archive' },
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
