import { NextResponse, NextRequest } from 'next/server';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getPromptRowsWithProjectId } from '@/libs/database/Prompts/queries';
import { getPromptResponseSummaryRowsWithProjectIdInDateRange } from '@/libs/database/PromptResponses/queries';
import { getSourceSummaryRowsWithProjectIdInDateRange } from '@/libs/database/Sources/queries';
import { getActiveCompetitorRowsWithProjectId } from '@/libs/database/Competitors/queries';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { z } from 'zod';
import { getOverviewData } from '@/libs/utils/project-analysis/getOverviewData';

export async function GET(req: NextRequest) {
  try {
    const { projectId } = z.object({ projectId: z.string() }).parse({
      projectId: req.nextUrl.searchParams.get('projectId'),
    });
    const project = await getProjectRowWithId(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // A Run whose items all failed never bumps `prompts_updated_at`; fall back to today so the
    // report renders empty rather than erroring (issue 12 removed the 503 retry branch).
    const targetDateISO = getISODateString(project.prompts_updated_at ?? new Date().toISOString());
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
