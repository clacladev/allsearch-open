import { NextResponse, NextRequest } from 'next/server';
import {
  getTopicRowWithId,
  getTopicRowsWithProjectId,
  insertTopicRow,
  updateTopicRow,
} from '@/libs/database/Topics/queries';
import z from 'zod';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getPromptRowsWithProjectId, updatePromptRowWithId } from '@/libs/database/Prompts/queries';
import { findOrCreateCustomTopic } from '../prompts/helpers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const body = await req.json();
    const { name } = z.object({ name: z.string().min(1) }).parse(body);

    const projectRow = await getProjectRowWithId(projectId);
    if (!projectRow) throw new Error('Project not found');

    const existingTopics = await getTopicRowsWithProjectId(projectId, true);
    const isDuplicate = existingTopics.some(
      (t) => t.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) throw new Error('A topic with this name already exists');

    const topicRow = await insertTopicRow({
      name: name.trim(),
      project_id: projectId,
    });

    return NextResponse.json(topicRow);
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
    const { topicId, name, unarchive } = z
      .object({
        topicId: z.string(),
        name: z.string().min(1).optional(),
        unarchive: z.boolean().optional(),
      })
      .parse(body);

    const topicRow = await getTopicRowWithId(topicId);
    if (!topicRow || topicRow.project_id !== projectId) throw new Error('Topic not found');

    const projectRow = await getProjectRowWithId(projectId);
    if (!projectRow) throw new Error('Project not found');

    const updates: Partial<Pick<(typeof topicRow), 'name' | 'is_archived'>> = {};
    if (name !== undefined) {
      const existingTopics = await getTopicRowsWithProjectId(projectId, true);
      const isDuplicate = existingTopics.some(
        (t) => t.id !== topicId && t.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (isDuplicate) throw new Error('A topic with this name already exists');
      updates.name = name.trim();
    }
    if (unarchive) updates.is_archived = false;

    const updated = await updateTopicRow(topicId, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const body = await req.json();
    const { topicId } = z.object({ topicId: z.string() }).parse(body);

    const topicRow = await getTopicRowWithId(topicId);
    if (!topicRow || topicRow.project_id !== projectId) throw new Error('Topic not found');

    const projectRow = await getProjectRowWithId(projectId);
    if (!projectRow) throw new Error('Project not found');

    // Reassign all prompts in this topic to the Custom topic
    const customTopic = await findOrCreateCustomTopic(projectId);
    const prompts = await getPromptRowsWithProjectId(projectId, true);
    const affectedPrompts = prompts.filter((p) => p.topic_id === topicId);
    await Promise.all(
      affectedPrompts.map((p) => updatePromptRowWithId(p.id, { topic_id: customTopic.id }))
    );

    await updateTopicRow(topicId, { is_archived: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
