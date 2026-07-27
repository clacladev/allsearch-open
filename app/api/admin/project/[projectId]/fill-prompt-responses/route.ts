import { NextRequest, NextResponse } from 'next/server';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import { getPostHogServer, searchParamsToObject } from '@/libs/posthog';
import { getUserProfileRowWithId } from '@/libs/database/UserProfiles/queries';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getTopicRowsWithProjectId, insertTopicRows } from '@/libs/database/Topics/queries';
import {
  getPromptRowsWithProjectId,
  insertPromptRows,
} from '@/libs/database/Prompts/queries';
import {
  getPromptResponseRowsWithProjectId,
  insertPromptResponseRows,
} from '@/libs/database/PromptResponses/queries';
import { PromptResponseRow } from '@/libs/database/PromptResponses/types';
import {
  getSourceRowsWithProjectId,
  insertSourceRows,
} from '@/libs/database/Sources/queries';
import { SourceRow } from '@/libs/database/Sources/types';
import { SUPPORTED_CHATBOTS_IDS } from '@/libs/database/shared/ChatbotId';
import { MAX_PROMPTS_DURING_TRIAL } from '@/libs/subscriptions';
import { isDevEnv } from '@/libs/env';

const BATCH_SIZE = 500;
const BACKFILL_DAYS = 91;

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function randomTimeOnDate(date: Date): string {
  const d = new Date(date);
  d.setHours(Math.floor(Math.random() * 14) + 6); // 6am–8pm
  d.setMinutes(Math.floor(Math.random() * 60));
  d.setSeconds(Math.floor(Math.random() * 60));
  return d.toISOString();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    if (!isDevEnv) {
      return NextResponse.json({ error: 'Dev only' }, { status: 403 });
    }

    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const user = await getUserOrThrow();
    const userProfile = await getUserProfileRowWithId(user.id, { asAdmin: true });
    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const project = await getProjectRowWithId(projectId, undefined, { asAdmin: true });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 1. Get or create a topic
    const topics = await getTopicRowsWithProjectId(projectId, { asAdmin: true });
    let topicId: string;
    if (topics.length > 0) {
      topicId = topics[0].id;
    } else {
      const [newTopic] = await insertTopicRows(
        [{ name: 'Backfill', project_id: projectId, author_id: user.id }],
        { asAdmin: true }
      );
      topicId = newTopic.id;
    }

    // 2. Max out prompts
    const existingPrompts = await getPromptRowsWithProjectId(projectId, false, { asAdmin: true });
    let promptsCreated = 0;
    const promptsToCreate = MAX_PROMPTS_DURING_TRIAL - existingPrompts.length;

    if (promptsToCreate > 0) {
      const newPrompts = await insertPromptRows(
        Array.from({ length: promptsToCreate }, (_, i) => ({
          name: `Demo prompt ${existingPrompts.length + i + 1}`,
          topic_id: topicId,
          project_id: projectId,
          organization_id: project.organization_id,
          author_id: user.id,
        })),
        { asAdmin: true }
      );
      promptsCreated = newPrompts.length;
      existingPrompts.push(...newPrompts);
    }

    const allPromptIds = existingPrompts.map((p) => p.id);

    // 3. Get existing responses and sources as templates
    const existingResponses = await getPromptResponseRowsWithProjectId(projectId, {
      asAdmin: true,
    });
    const existingSourceRows = await getSourceRowsWithProjectId(projectId, { asAdmin: true });

    // Group responses by prompt_id+chatbot_id
    const responsesByPromptChatbot = new Map<string, PromptResponseRow[]>();
    // Also group all responses by prompt_id (fallback)
    const responsesByPrompt = new Map<string, PromptResponseRow[]>();
    // All responses as a final fallback
    const allResponses: PromptResponseRow[] = existingResponses;

    for (const r of existingResponses) {
      const key = `${r.prompt_id}:${r.chatbot_id}`;
      const arr = responsesByPromptChatbot.get(key);
      if (arr) arr.push(r);
      else responsesByPromptChatbot.set(key, [r]);

      const arr2 = responsesByPrompt.get(r.prompt_id);
      if (arr2) arr2.push(r);
      else responsesByPrompt.set(r.prompt_id, [r]);
    }

    // Group sources by prompt_response_id
    const sourcesByResponseId = new Map<string, SourceRow[]>();
    for (const s of existingSourceRows) {
      const arr = sourcesByResponseId.get(s.prompt_response_id);
      if (arr) arr.push(s);
      else sourcesByResponseId.set(s.prompt_response_id, [s]);
    }

    // Build set of existing (prompt_id, chatbot_id, date) combos
    const existingCombos = new Set<string>();
    for (const r of existingResponses) {
      existingCombos.add(`${r.prompt_id}:${r.chatbot_id}:${dateKey(new Date(r.created_at))}`);
    }

    // 4. Generate backfill data
    const now = new Date();
    const responsesToInsert: Array<{
      text: string;
      brand_ids_ranking: string[];
      sentiment: PromptResponseRow['sentiment'];
      model_id: string;
      chatbot_id: PromptResponseRow['chatbot_id'];
      prompt_id: string;
      project_id: string;
      workflow_id: string;
      created_at: string;
      _templateSources: SourceRow[];
    }> = [];

    for (let dayOffset = BACKFILL_DAYS; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - dayOffset);
      targetDate.setHours(0, 0, 0, 0);
      const dk = dateKey(targetDate);

      for (const promptId of allPromptIds) {
        for (const chatbotId of SUPPORTED_CHATBOTS_IDS) {
          if (existingCombos.has(`${promptId}:${chatbotId}:${dk}`)) continue;

          // Find a template
          const key = `${promptId}:${chatbotId}`;
          let templates = responsesByPromptChatbot.get(key);
          if (!templates?.length) templates = responsesByPrompt.get(promptId);
          if (!templates?.length) templates = allResponses;
          if (!templates?.length) continue;

          const template = templates[Math.floor(Math.random() * templates.length)];
          const templateSources = sourcesByResponseId.get(template.id) ?? [];
          const createdAt = randomTimeOnDate(targetDate);

          responsesToInsert.push({
            text: template.text,
            brand_ids_ranking: template.brand_ids_ranking,
            sentiment: template.sentiment,
            model_id: template.model_id,
            chatbot_id: chatbotId,
            prompt_id: promptId,
            project_id: projectId,
            workflow_id: 'backfill',
            created_at: createdAt,
            _templateSources: templateSources,
          });
        }
      }
    }

    // 5. Batch insert responses and their sources
    let responsesCreated = 0;
    let sourcesCreated = 0;

    for (let i = 0; i < responsesToInsert.length; i += BATCH_SIZE) {
      const batch = responsesToInsert.slice(i, i + BATCH_SIZE);
      const insertedRows = await insertPromptResponseRows(
        batch.map(({ _templateSources: _, ...r }) => r),
        { asAdmin: true }
      );
      responsesCreated += insertedRows.length;

      // Build source rows for this batch
      const sourceRowsToInsert: Array<
        Omit<SourceRow, 'id' | 'created_at'> & { created_at?: string }
      > = [];

      for (let j = 0; j < batch.length; j++) {
        const templateSources = batch[j]._templateSources;
        const newResponseId = insertedRows[j].id;
        const createdAt = batch[j].created_at;

        for (const src of templateSources) {
          const suffix = `?_bf=${crypto.randomUUID().slice(0, 8)}`;
          sourceRowsToInsert.push({
            project_id: projectId,
            prompt_id: batch[j].prompt_id,
            prompt_response_id: newResponseId,
            is_cited: src.is_cited,
            position: src.position,
            clean_url: src.clean_url + suffix,
            url: src.url + suffix,
            hostname: src.hostname,
            raw_url: src.raw_url,
            title: src.title,
            description: src.description,
            headings: src.headings,
            brand_ids_ranking: src.brand_ids_ranking,
            created_at: createdAt,
          });
        }
      }

      if (sourceRowsToInsert.length > 0) {
        for (let k = 0; k < sourceRowsToInsert.length; k += BATCH_SIZE) {
          const srcBatch = sourceRowsToInsert.slice(k, k + BATCH_SIZE);
          const inserted = await insertSourceRows(srcBatch, { asAdmin: true });
          sourcesCreated += inserted.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      promptsCreated,
      responsesCreated,
      sourcesCreated,
    });
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
