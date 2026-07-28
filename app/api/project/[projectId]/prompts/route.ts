import { NextResponse, NextRequest } from 'next/server';
import {
  getPromptRowsWithProjectId,
  getPromptRowWithId,
  insertPromptRow,
  updatePromptRowWithId,
} from '@/libs/database/Prompts/queries';
import { getTopicRowWithId } from '@/libs/database/Topics/queries';
import z from 'zod';
import { findOrCreateCustomTopic } from './helpers';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { normalizePromptName } from '@/libs/utils/prompts';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const body = await req.json();
    const { names, topicId } = z
      .object({
        names: z.array(z.string()),
        topicId: z.string().optional(),
      })
      .parse(body);

    // Find or create topic
    let topicRow;
    if (topicId) {
      topicRow = await getTopicRowWithId(topicId);
      if (!topicRow || topicRow.project_id !== projectId) {
        throw new Error('Failed to get topic');
      }
    } else {
      topicRow = await findOrCreateCustomTopic(projectId);
    }

    // Get all the prompts in the topic
    const [projectRow, promptRows] = await Promise.all([
      getProjectRowWithId(projectId),
      getPromptRowsWithProjectId(projectId, true),
    ]);
    if (!projectRow) throw new Error('Project not found');

    const results = [];
    for (const name of names) {
      const match = promptRows.find(
        (p) => normalizePromptName(p.name) === normalizePromptName(name)
      );
      if (match) {
        if (!match.is_archived) continue; // skip duplicate active prompts silently

        const restoredPrompt = await updatePromptRowWithId(match.id, { is_archived: false });
        if (!restoredPrompt) throw new Error('Failed to restore archived prompt');
        results.push(restoredPrompt);
        continue;
      }

      const promptRow = await insertPromptRow({
        name,
        topic_id: topicRow.id,
        project_id: projectId,
      });
      if (!promptRow) throw new Error('Failed to save prompt');
      results.push(promptRow);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const body = await req.json();
    const { name, promptId, topicId } = z
      .object({
        name: z.string(),
        promptId: z.string(),
        topicId: z.string().optional(),
      })
      .parse(body);

    const promptRow = await getPromptRowWithId(promptId);
    if (!promptRow || promptRow.project_id !== projectId) {
      throw new Error('Failed to get prompt');
    }

    if (topicId) {
      const topicRow = await getTopicRowWithId(topicId);
      if (!topicRow || topicRow.project_id !== projectId) {
        throw new Error('Failed to get topic');
      }
    }

    const updatedPromptRow = await updatePromptRowWithId(promptId, {
      name,
      ...(topicId ? { topic_id: topicId } : {}),
    });
    if (!updatedPromptRow) throw new Error('Failed to update prompt');

    return NextResponse.json(updatedPromptRow);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
