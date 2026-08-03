import { NextResponse, NextRequest } from 'next/server';
import { createCollectionRun, ensureCollectionRunLoopIsRunning } from '@/libs/collection';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return new Response('Missing projectId', { status: 400 });

    const shouldForce = req.nextUrl.searchParams.get('shouldForce') === 'true';
    const run = await createCollectionRun({ projectIds: [projectId], shouldForce });
    ensureCollectionRunLoopIsRunning();

    return Response.json({ message: 'Collection Run started', runId: run.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
