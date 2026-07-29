import { NextResponse, NextRequest } from 'next/server';
import {
  getCompetitorRowsWithProjectId,
  getCompetitorRowWithId,
  insertCompetitorRow,
  updateCompetitorRowWithId,
} from '@/libs/database/Competitors/queries';
import { CompetitorSchema } from '@/app/api/new-project/save/types';
import { isCompetitorUnique } from '@/app/(private)/project/[projectId]/settings/[tabId]/components/helpers';
import z from 'zod';
import { getSafeNewUrl } from '@/libs/utils/urls';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const projectRow = await getProjectRowWithId(projectId);
    if (!projectRow) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const competitors = await getCompetitorRowsWithProjectId(projectId);

    return NextResponse.json(competitors);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const body = await req.json();
    const competitor = CompetitorSchema.parse(body);

    // Get all the prompts in the group
    const [projectRow, competitorRows] = await Promise.all([
      getProjectRowWithId(projectId),
      getCompetitorRowsWithProjectId(projectId),
    ]);
    if (!projectRow) throw new Error('Project not found');

    // Check if an archived competitor with the same URL exists — unarchive it instead
    const archivedMatch = competitorRows.find((c) => c.is_archived && c.url === competitor.url);
    if (archivedMatch) {
      const restored = await updateCompetitorRowWithId(archivedMatch.id, {
        is_archived: false,
        name: competitor.name || null,
        icon_url: competitor.iconUrl || null,
      });
      if (!restored) throw new Error('Failed to restore archived competitor');
      return NextResponse.json(restored);
    }

    const activeCompetitors = competitorRows.filter((c) => !c.is_archived);
    const isUnique = isCompetitorUnique(activeCompetitors, competitor.name, competitor.url);
    if (!isUnique) throw new Error('A competitor with the same name or URL already exists');

    const competitorRow = await insertCompetitorRow({
      url: competitor.url,
      hostname: getSafeNewUrl(competitor.url).hostname,
      name: competitor.name || null,
      aliases: [],
      icon_url: competitor.iconUrl || null,
      project_id: projectId,
    });
    if (!competitorRow) throw new Error('Failed to save competitor');

    return NextResponse.json(competitorRow);
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
    const { competitorId, name } = z
      .object({ competitorId: z.string(), name: z.string().trim().optional() })
      .parse(body);

    const competitorRow = await getCompetitorRowWithId(competitorId);
    if (!competitorRow || competitorRow.project_id !== projectId) {
      throw new Error('Competitor not found');
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) {
      const competitorRows = await getCompetitorRowsWithProjectId(projectId);
      const activeCompetitors = competitorRows.filter(
        (c) => !c.is_archived && c.id !== competitorId
      );
      if (activeCompetitors.some((c) => c.name === name)) {
        throw new Error('A competitor with the same name already exists');
      }
      updates.name = name || null;
    } else {
      updates.is_archived = false;
    }

    const updatedRow = await updateCompetitorRowWithId(competitorId, updates);
    if (!updatedRow) throw new Error('Failed to update competitor');

    return NextResponse.json(updatedRow);
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
    const { competitorId } = z.object({ competitorId: z.string() }).parse(body);

    const competitorRow = await getCompetitorRowWithId(competitorId);
    if (!competitorRow || competitorRow.project_id !== projectId) {
      throw new Error('Competitor not found');
    }

    const archivedRow = await updateCompetitorRowWithId(competitorId, { is_archived: true });
    if (!archivedRow) throw new Error('Failed to delete competitor');

    return NextResponse.json(archivedRow);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
