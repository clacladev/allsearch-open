import { NextRequest, NextResponse } from 'next/server';
import { getCollectionRunProgress } from '@/libs/collection';
import {
  COLLECTION_RUN_PROGRESS_HEARTBEAT_MS,
  COLLECTION_RUN_PROGRESS_POLL_INTERVAL_MS,
  COLLECTION_RUN_PROGRESS_RETRY_MS,
} from '@/libs/collection/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Resolves after `ms`, or early if `signal` aborts first — so the poll loop below wakes up
 * immediately on client disconnect instead of waiting out the rest of the interval. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timeout);
      resolve();
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const initial = await getCollectionRunProgress(runId);
  if (!initial) {
    return NextResponse.json({ error: 'Collection Run not found' }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let isClosed = false;
      function close() {
        if (isClosed) return;
        isClosed = true;
        try {
          controller.close();
        } catch {}
      }
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        controller.enqueue(encoder.encode(`retry: ${COLLECTION_RUN_PROGRESS_RETRY_MS}\n\n`));

        send('progress', initial);
        let previousSerialised = JSON.stringify(initial);
        let lastWriteAt = Date.now();
        if (initial.isTerminal) {
          send('done', initial);
          close();
          return;
        }

        while (!req.signal.aborted) {
          await sleep(COLLECTION_RUN_PROGRESS_POLL_INTERVAL_MS, req.signal);
          if (req.signal.aborted) break;

          const progress = await getCollectionRunProgress(runId);
          if (!progress) break;

          const serialised = JSON.stringify(progress);
          if (serialised !== previousSerialised) {
            send('progress', progress);
            previousSerialised = serialised;
            lastWriteAt = Date.now();
          } else if (Date.now() - lastWriteAt >= COLLECTION_RUN_PROGRESS_HEARTBEAT_MS) {
            controller.enqueue(encoder.encode(': ping\n\n'));
            lastWriteAt = Date.now();
          }

          if (progress.isTerminal) {
            send('done', progress);
            break;
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        close();
      }
    },
    cancel() {
      // Client disconnected; `req.signal` already ends the loop.
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
