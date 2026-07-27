import { NextResponse, NextRequest } from 'next/server';
import { getUserOrThrow } from '@/libs/database/supabase/server';
import { z } from 'zod';
import { BrandSchema, CompetitorSchema, PromptIdsSchema, SaveNewProjectResponse } from './types';
import { getOrganizationRowWithOwnerId } from '@/libs/database/Organizations/queries';
import { insertProjectRow } from '@/libs/database/Projects/queries';

import { insertTopicRows } from '@/libs/database/Topics/queries';
import { getTopicsMapFromIds, getPromptsMapFromTopicRows } from './helpers';
import { insertPromptRows } from '@/libs/database/Prompts/queries';
import { insertCompetitorRows } from '@/libs/database/Competitors/queries';
import { start } from 'workflow/api';
import { fetchDailyPromptsForProjectWorkflow } from '@/libs/workflows/fetchDailyPromptsForProject';
import { getTodayISODateString } from '@/libs/database/shared/ISODateString';
import { getSafeNewUrl } from '@/libs/utils/urls';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brand, promptsIds, competitors } = z
      .object({
        brand: BrandSchema,
        promptsIds: PromptIdsSchema,
        competitors: CompetitorSchema.array(),
      })
      .parse(body);

    const user = await getUserOrThrow();

    // Organization's checks
    const organizationRow = await getOrganizationRowWithOwnerId(user.id);
    if (!organizationRow) throw new Error('Organization not found');

    // Create new project
    const projectRow = await insertProjectRow({
      url: brand.url,
      hostname: getSafeNewUrl(brand.url).hostname,
      name: brand.name,
      aliases: [],
      icon_url: brand.iconUrl || null,
      target_location: brand.targetLocation || null,
      organization_id: organizationRow.id,
      author_id: user.id,
    });

    // Create topics
    const topicsMap = getTopicsMapFromIds(promptsIds);
    const topicInputs = topicsMap
      .keys()
      .toArray()
      .map((name) => ({
        name,
        project_id: projectRow.id,
        author_id: user.id,
      }));
    const topicRows = await insertTopicRows(topicInputs);
    if (!topicRows.length) throw new Error('Failed to save topics');

    // Create prompts
    const topicsPromptsMap = getPromptsMapFromTopicRows(promptsIds, topicRows);
    const promptInputs = [...topicsPromptsMap.entries()].flatMap(([topicId, prompts]) =>
      prompts.map((prompt) => ({
        name: prompt,
        topic_id: topicId,
        project_id: projectRow.id,
        organization_id: organizationRow.id,
        author_id: user.id,
      }))
    );
    const promptRows = await insertPromptRows(promptInputs);
    if (!promptRows.length) throw new Error('Failed to save prompts');

    // Create competitors
    const competitorInputs = competitors.map((competitor) => ({
      url: competitor.url,
      hostname: getSafeNewUrl(competitor.url).hostname,
      name: competitor.name || null,
      aliases: [],
      icon_url: competitor.iconUrl || null,
      project_id: projectRow.id,
      organization_id: organizationRow.id,
      author_id: user.id,
    }));
    const competitorRows = await insertCompetitorRows(competitorInputs);
    if (!competitorRows.length) throw new Error('Failed to save competitors');

    // Start the prompt requests workflow
    const today = getTodayISODateString();
    const run = await start(fetchDailyPromptsForProjectWorkflow, [projectRow.id, today]);

    // Return response
    const response: SaveNewProjectResponse = { projectId: projectRow.id, workflowId: run.runId };
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
