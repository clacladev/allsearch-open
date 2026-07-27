import { NextRequest, NextResponse } from 'next/server';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import { getPostHogServer, searchParamsToObject } from '@/libs/posthog';
import { getPromptRowsWithProjectId, updatePromptRowWithId } from '@/libs/database/Prompts/queries';
import z from 'zod';
import { MAX_PROMPTS_DURING_TRIAL } from '@/libs/subscriptions';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const { promptId, action } = z
      .object({
        promptId: z.string(),
        action: z.enum(['archive', 'restore']),
      })
      .parse(await req.json());

    const user = await getUserOrThrow();

    const promptRows = await getPromptRowsWithProjectId(projectId, true);
    if (!promptRows.length) throw new Error('Failed to get prompts');

    const promptRow = promptRows.find((prompt) => prompt.id === promptId);
    if (!promptRow) throw new Error('Failed to get prompt');
    if (promptRow.author_id !== user.id) {
      throw new Error('You are not authorized to archive this prompt');
    }

    // TODO: Check subscription status
    const activePromptsCount = promptRows.filter((p) => !p.is_archived).length;
    if (action === 'restore' && activePromptsCount >= MAX_PROMPTS_DURING_TRIAL) {
      throw new Error(
        `You've reached the trial limit of ${MAX_PROMPTS_DURING_TRIAL} prompts. Subscribe to unlock more.`
      );
    }

    const updatedPromptRow = await updatePromptRowWithId(promptId, {
      is_archived: action === 'archive',
    });
    if (!updatedPromptRow) throw new Error('Failed to update prompts archive status');

    return NextResponse.json(updatedPromptRow);
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
