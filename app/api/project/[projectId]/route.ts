import { NextResponse, NextRequest } from 'next/server';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import { getPostHogServer, searchParamsToObject } from '@/libs/posthog';
import { BrandSchema } from '../../new-project/save/types';
import { getProjectRowWithId, updateProjectRow } from '@/libs/database/Projects/queries';
import { getSafeNewUrl } from '@/libs/utils/urls';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const body = await req.json();
    const { url, name, iconUrl, targetLocation } = BrandSchema.parse(body);

    const user = await getUserOrThrow();

    const projectRow = await getProjectRowWithId(projectId);
    if (!projectRow || projectRow.author_id !== user.id) {
      throw new Error('Failed to get project');
    }

    const updatedProjectRow = await updateProjectRow(projectId, {
      url,
      hostname: getSafeNewUrl(url).hostname,
      name,
      icon_url: iconUrl || null,
      target_location: targetLocation || null,
    });
    if (!updatedProjectRow) throw new Error('Failed to update project');

    return NextResponse.json(updatedProjectRow);
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
