import { NextResponse, NextRequest } from 'next/server';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import { getPostHogServer, searchParamsToObject } from '@/libs/posthog';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getPromptRowsWithProjectId } from '@/libs/database/Prompts/queries';
import { getPromptResponseSummaryRowsWithProjectIdInDateRange } from '@/libs/database/PromptResponses/queries';
import { getSourceSummaryRowsWithProjectIdInDateRange } from '@/libs/database/Sources/queries';
import { REPORT_TRY_AGAIN_LATER_ERROR_CODE } from './types';
import { getActiveCompetitorRowsWithProjectId } from '@/libs/database/Competitors/queries';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { z } from 'zod';
import { getOverviewData } from '@/libs/utils/project-analysis/getOverviewData';

export async function GET(req: NextRequest) {
  try {
    const { projectId } = z.object({ projectId: z.string() }).parse({
      projectId: req.nextUrl.searchParams.get('projectId'),
    });
    await getUserOrThrow();

    const project = await getProjectRowWithId(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.prompts_updated_at) {
      return NextResponse.json(
        { error: 'Project prompts not updated yet', code: REPORT_TRY_AGAIN_LATER_ERROR_CODE },
        { status: 503 }
      );
    }

    const targetDateISO = getISODateString(project.prompts_updated_at);
    const [promptResponses, competitors, prompts, sourceRows] = await Promise.all([
      getPromptResponseSummaryRowsWithProjectIdInDateRange(projectId, targetDateISO, targetDateISO),
      getActiveCompetitorRowsWithProjectId(projectId),
      getPromptRowsWithProjectId(projectId),
      getSourceSummaryRowsWithProjectIdInDateRange(projectId, targetDateISO, targetDateISO),
    ]);

    const activePromptIds = new Set(prompts.map((prompt) => prompt.id));
    const filteredPromptResponses = promptResponses.filter((response) =>
      activePromptIds.has(response.prompt_id)
    );

    const overviewData = await getOverviewData(
      targetDateISO,
      targetDateISO,
      project,
      competitors,
      filteredPromptResponses,
      sourceRows
    );
    return NextResponse.json(overviewData);
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
