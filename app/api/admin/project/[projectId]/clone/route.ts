import { NextRequest, NextResponse } from 'next/server';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import { getPostHogServer, searchParamsToObject } from '@/libs/posthog';
import { getUserProfileRowWithId } from '@/libs/database/UserProfiles/queries';
import { getProjectRowWithId, insertProjectRow } from '@/libs/database/Projects/queries';
import { getOrganizationRowWithOwnerId } from '@/libs/database/Organizations/queries';
import {
  getTopicRowsWithProjectId,
  insertTopicRows,
  updateTopicRow,
} from '@/libs/database/Topics/queries';
import {
  getCompetitorRowsWithProjectId,
  insertCompetitorRows,
  updateCompetitorRowWithId,
} from '@/libs/database/Competitors/queries';
import {
  getPromptRowsWithProjectId,
  insertPromptRows,
  updatePromptRowWithId,
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

const BATCH_SIZE = 500;

function remapBrandIds(
  brandIds: string[],
  brandIdMap: Record<string, string>
): string[] {
  return brandIds.map((id) => brandIdMap[id] ?? id);
}

function remapSentiment(
  sentiment: PromptResponseRow['sentiment'],
  brandIdMap: Record<string, string>
): PromptResponseRow['sentiment'] {
  if (!sentiment) return undefined;
  const remapped: Record<string, number> = {};
  for (const [key, value] of Object.entries(sentiment)) {
    remapped[brandIdMap[key] ?? key] = value;
  }
  return remapped as PromptResponseRow['sentiment'];
}

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

    // Get admin's organization
    const adminOrg = await getOrganizationRowWithOwnerId(user.id, { asAdmin: true });
    if (!adminOrg) {
      return NextResponse.json({ error: 'Admin organization not found' }, { status: 404 });
    }

    // Get source project
    const sourceProject = await getProjectRowWithId(projectId, undefined, { asAdmin: true });
    if (!sourceProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 1. Clone project
    const newProject = await insertProjectRow(
      {
        url: sourceProject.url,
        hostname: sourceProject.hostname,
        name: `${sourceProject.name} (Clone)`,
        aliases: sourceProject.aliases,
        icon_url: sourceProject.icon_url,
        target_location: sourceProject.target_location,
        organization_id: adminOrg.id,
        author_id: user.id,
      },
      { asAdmin: true }
    );

    // 2. Clone topics
    const sourceTopics = await getTopicRowsWithProjectId(projectId, {
      asAdmin: true,
      includeArchived: true,
    });
    const topicIdMap: Record<string, string> = {};
    if (sourceTopics.length > 0) {
      const newTopics = await insertTopicRows(
        sourceTopics.map((t) => ({
          name: t.name,
          project_id: newProject.id,
          author_id: user.id,
          created_at: t.created_at,
        })),
        { asAdmin: true }
      );
      sourceTopics.forEach((old, i) => {
        topicIdMap[old.id] = newTopics[i].id;
      });
      await Promise.all(
        sourceTopics
          .filter((t) => t.is_archived)
          .map((t) => updateTopicRow(topicIdMap[t.id], { is_archived: true }, { asAdmin: true }))
      );
    }

    // 3. Clone competitors
    const sourceCompetitors = await getCompetitorRowsWithProjectId(projectId, { asAdmin: true });
    const competitorIdMap: Record<string, string> = {};
    if (sourceCompetitors.length > 0) {
      const newCompetitors = await insertCompetitorRows(
        sourceCompetitors.map((c) => ({
          url: c.url,
          hostname: c.hostname,
          name: c.name,
          aliases: c.aliases,
          icon_url: c.icon_url,
          project_id: newProject.id,
          organization_id: adminOrg.id,
          author_id: user.id,
          created_at: c.created_at,
        })),
        { asAdmin: true }
      );
      sourceCompetitors.forEach((old, i) => {
        competitorIdMap[old.id] = newCompetitors[i].id;
      });
      await Promise.all(
        sourceCompetitors
          .filter((c) => c.is_archived)
          .map((c) =>
            updateCompetitorRowWithId(
              competitorIdMap[c.id],
              { is_archived: true },
              { asAdmin: true }
            )
          )
      );
    }

    // 4. Clone prompts
    const sourcePrompts = await getPromptRowsWithProjectId(projectId, true, { asAdmin: true });
    const promptIdMap: Record<string, string> = {};
    if (sourcePrompts.length > 0) {
      const newPrompts = await insertPromptRows(
        sourcePrompts.map((p) => ({
          name: p.name,
          topic_id: topicIdMap[p.topic_id] ?? p.topic_id,
          project_id: newProject.id,
          organization_id: adminOrg.id,
          author_id: user.id,
          created_at: p.created_at,
        })),
        { asAdmin: true }
      );
      sourcePrompts.forEach((old, i) => {
        promptIdMap[old.id] = newPrompts[i].id;
      });
      await Promise.all(
        sourcePrompts
          .filter((p) => p.is_archived)
          .map((p) =>
            updatePromptRowWithId(promptIdMap[p.id], { is_archived: true }, { asAdmin: true })
          )
      );
    }

    // 5. Clone prompt responses (without sources column)
    const sourceResponses = await getPromptResponseRowsWithProjectId(projectId, {
      asAdmin: true,
    });

    if (sourceResponses.length > 0) {
      // Build brand ID map: old project/competitor IDs -> new IDs
      const brandIdMap: Record<string, string> = {
        [sourceProject.id]: newProject.id,
        ...competitorIdMap,
      };

      // Build a map of old response IDs to new response IDs for source row remapping
      const responseIdMap: Record<string, string> = {};

      // Insert prompt responses in batches
      for (let i = 0; i < sourceResponses.length; i += BATCH_SIZE) {
        const batch = sourceResponses.slice(i, i + BATCH_SIZE);
        const insertedRows = await insertPromptResponseRows(
          batch.map((r) => ({
            text: r.text,
            brand_ids_ranking: remapBrandIds(r.brand_ids_ranking, brandIdMap),
            sentiment: remapSentiment(r.sentiment, brandIdMap),
            model_id: r.model_id,
            chatbot_id: r.chatbot_id,
            prompt_id: promptIdMap[r.prompt_id] ?? r.prompt_id,
            project_id: newProject.id,
            workflow_id: r.workflow_id,
            created_at: r.created_at,
          })),
          { asAdmin: true }
        );
        batch.forEach((old, j) => {
          responseIdMap[old.id] = insertedRows[j].id;
        });
      }

      // Clone source rows from the sources table
      const allSourceRows = await getSourceRowsWithProjectId(projectId, { asAdmin: true });
      if (allSourceRows.length > 0) {
        const remappedSourceRows = allSourceRows.map((row: SourceRow) => ({
          project_id: newProject.id,
          prompt_id: promptIdMap[row.prompt_id] ?? row.prompt_id,
          prompt_response_id: responseIdMap[row.prompt_response_id] ?? row.prompt_response_id,
          is_cited: row.is_cited,
          position: row.position,
          clean_url: row.clean_url,
          url: row.url,
          hostname: row.hostname,
          raw_url: row.raw_url,
          title: row.title,
          description: row.description,
          headings: row.headings,
          brand_ids_ranking: remapBrandIds(row.brand_ids_ranking, brandIdMap),
          created_at: row.created_at,
        }));

        for (let i = 0; i < remappedSourceRows.length; i += BATCH_SIZE) {
          const batch = remappedSourceRows.slice(i, i + BATCH_SIZE);
          await insertSourceRows(batch, { asAdmin: true });
        }
      }
    }

    return NextResponse.json(newProject);
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
